import { DecisionEngine } from "../decision-engine";
import type { ExtDvTask, ExtendedDecisionOptions } from "../decision-options";
import { computeSchedulingHint } from "./decision-scheduling-hints";
import type { DaySchedule, ScheduledItem, TimeBlockPlan } from "./schedule-types";

export function durationMinutes(t: ExtDvTask): number | null {
	const m = t.duration?.asMinutes();
	return Number.isFinite(m) && (m ?? 0) > 0 ? Math.round(m!) : null;
}

export function fits(block: TimeBlockPlan, task: ExtDvTask, remainingMin: number): boolean {
	const m = durationMinutes(task);
	if (m === null) {
		return false;
	}
	return m <= remainingMin && m <= block.minutes;
}

export function isCommittedB5(task: ExtDvTask): boolean {
	const tags = task.taskx.tags ?? [];
	return tags.includes("#b5") || tags.includes("#B5");
}

/**
 * We fill blocks with a conservative strategy:
 * - deep blocks: prefer high value tasks, allow higher friction, avoid authority by default
 * - admin blocks: allow authority + estimate/cleanup tasks
 * - shallow blocks: prefer low friction tasks
 *
 * We do not mutate tasks or create implicit commitment; we only propose items.
 */
export function fillDaySchedule(
	options: ExtendedDecisionOptions,
	schedule: Omit<DaySchedule, "items"> & { blocks: TimeBlockPlan[] },
	allTasks: ExtDvTask[],
): ScheduledItem[] {
	const engine = new DecisionEngine(options);

	// Pools
	const committed = allTasks.filter(isCommittedB5).sort((a, b) => b.score - a.score);
	const b5Candidates = engine.collectB5Candidates(allTasks);
	const workshop = engine.collectWorkshopCandidates(allTasks);

	// Authority pool (useful for B3-close blocks)
	const authority = allTasks.filter(t => t.isAuthority).sort((a, b) => b.score - a.score);

	// Remaining pool excludes committed tasks to avoid duplicates.
	const committedIds = new Set(committed.map(t => t.id));
	const pool = allTasks.filter(t => !committedIds.has(t.id));

	// Helper: pick best next task for a block.
	const pick = (
		block: TimeBlockPlan,
		candidates: ExtDvTask[],
		remainingMin: number,
	): ExtDvTask | null => {
		const filtered = candidates.filter(t => {
			// Authority gate
			if (!block.allowAuthority && t.isAuthority) {
				return false;
			}

			// Min urgency gate
			if (block.minUrgency) {
				const hint = computeSchedulingHint(t);
				const order = { low: 0, medium: 1, high: 2, critical: 3 } as const;
				if (order[hint.urgency] < order[block.minUrgency]) {
					return false;
				}
			}

			return true;
		});

		// Sorting logic is explainable and stable.
		filtered.sort((a, b) => {
			const ha = computeSchedulingHint(a);
			const hb = computeSchedulingHint(b);

			const urg = { low: 0, medium: 1, high: 2, critical: 3 } as const;
			const val = { low: 0, medium: 1, high: 2 } as const;
			const fr = { low: 0, medium: 1, high: 2 } as const;

			// For deep blocks, we prioritize value then urgency.
			// For shallow/admin, we prioritize urgency then low friction.
			if (block.profile.mode === "deep") {
				return (
					val[hb.value] - val[ha.value] ||
					urg[hb.urgency] - urg[ha.urgency] ||
					fr[ha.friction] - fr[hb.friction] || // higher friction later
					b.score - a.score
				);
			}

			// Shallow/admin: urgency first, then low friction.
			return (
				urg[hb.urgency] - urg[ha.urgency] ||
				fr[ha.friction] - fr[hb.friction] ||
				val[hb.value] - val[ha.value] ||
				b.score - a.score
			);
		});

		for (const t of filtered) {
			if (fits(block, t, remainingMin)) {
				return t;
			}
		}
		return null;
	};

	const items: ScheduledItem[] = [];

	// If R0 gate blocks exist, we do not fill beyond them.
	// This matches your “rail” rule: no pretending until R0 is done.
	if (!schedule.context.isR0Done) {
		for (const b of schedule.blocks) {
			items.push({ kind: "block", block: b });
		}
		return items;
	}

	// Fill each block in order.
	for (const b of schedule.blocks) {
		items.push({ kind: "block", block: b });

		let cursor = b.start.clone();
		let remaining = b.minutes;

		// Choose source pools by operation kind.
		let sources: ExtDvTask[][] = [];

		switch (b.kind) {
			case "op:b5-execute":
				// Execute: committed first, then candidates, then pool
				sources = [committed, b5Candidates, pool];
				break;

			case "op:b4-workshop":
				// Workshop: focus on workshop candidates
				sources = [workshop, pool];
				break;

			case "op:b3-close":
				// Close: authority tasks first
				sources = [authority, committed, pool];
				break;

			case "op:b2-judge":
				// Judge: triage / review; we can show candidates from pool
				sources = [pool];
				break;

			case "op:b1-do-now":
				// Do-now: short executable things; reuse b5Candidates + pool
				sources = [b5Candidates, pool];
				break;

			default:
				// Governance or fixed-like blocks: do not schedule tasks inside.
				continue;
		}

		while (remaining >= 10) {
			let chosen: ExtDvTask | null = null;

			for (const src of sources) {
				chosen = pick(b, src, remaining);
				if (chosen) {
					// Remove from all sources to keep uniqueness.
					for (const s of sources) {
						const i = s.findIndex(x => x.id === chosen!.id);
						if (i >= 0) {
							s.splice(i, 1);
						}
					}
					const iPool = pool.findIndex(x => x.id === chosen!.id);
					if (iPool >= 0) {
						pool.splice(iPool, 1);
					}
					break;
				}
			}

			if (!chosen) {
				break;
			}

			const m = durationMinutes(chosen)!;
			const start = cursor.clone();
			const end = cursor.clone().add(m, "minutes");

			items.push({ kind: "task", task: chosen, start, end });

			cursor = end;
			remaining -= m;
		}
	}

	return items;
}
