import type { DataviewInlineApi } from "obsidian-dataview";

import { fmt } from "./helpers";
import type { DaySchedule, ScheduledItem, TimeBlockPlan } from "./schedule-types";
import { DecisionEngine } from "../decision-engine";
import { type ExtendedDecisionOptions } from "../decision-options";
import { computeSchedulingHint } from "./decision-scheduling-hints";

export function inInterval(now: moment.Moment, s: moment.Moment, e: moment.Moment): boolean {
	return (now.isSame(s) || now.isAfter(s)) && now.isBefore(e);
}

export function findActiveItem(schedule: DaySchedule): {
	active: ScheduledItem | null;
	activeBlock: TimeBlockPlan | null;
} {
	const now = schedule.context.now;

	// Prefer task items (more specific), else fall back to block container.
	for (const it of schedule.items) {
		if (it.kind === "task" && inInterval(now, it.start, it.end)) {
			// Find the enclosing block by time overlap
			const b = schedule.blocks.find(bl => inInterval(now, bl.start, bl.end)) ?? null;
			return { active: it, activeBlock: b };
		}
	}

	const block = schedule.blocks.find(b => inInterval(now, b.start, b.end)) ?? null;
	if (block) {
		return { active: { kind: "block", block }, activeBlock: block };
	}
	return { active: null, activeBlock: null };
}

export function explainKind(kind: TimeBlockPlan["kind"]): string {
	switch (kind) {
		case "governance:r0":
			return "We decide the rail of the day (R0). Until this is done, we don’t pretend we can schedule execution.";
		case "governance:b5-commit":
			return "We build/confirm explicit commitments (#b5) so execution is anchored in reality.";
		case "op:b5-execute":
			return "We execute eligible tasks (leaf, unblocked, with duration) chosen by score and profile.";
		case "op:b4-workshop":
			return "We improve tasks: clarify, split, add durations, unblock prerequisites, then dispatch.";
		case "op:b3-close":
			return "We close authority/external tasks: accept / negotiate / refuse, then produce next actions.";
		case "op:b2-judge":
			return "We triage candidates: decide next operator (commit / workshop / embargo / hold).";
		case "op:b6-embargo":
			return "We park/contain residue and define exit events (no rumination).";
		case "op:b1-do-now":
			return "We do very short stable actions locally (no planning overhead).";
		default:
			return "Time block.";
	}
}

export function renderTaskLine(dv: DataviewInlineApi, label: string, markdown: string): void {
	dv.paragraph(`- **${label}:** ${markdown}`);
}

export function renderNowView(
	dv: DataviewInlineApi,
	options: ExtendedDecisionOptions,
	schedule: DaySchedule,
): void {
	const now = schedule.context.now;

	const { active, activeBlock } = findActiveItem(schedule);

	dv.paragraph(`**Now:** ${now.format("dddd YYYY-MM-DD HH:mm")}`);

	// Diagnostics first (short)
	if (schedule.diagnostics.length) {
		dv.paragraph(`**Diagnostics:** ${schedule.diagnostics.slice(0, 4).join(" · ")}`);
	}

	if (!activeBlock) {
		dv.paragraph("**No active block** within today’s horizon.");
		return;
	}

	dv.paragraph(
		`**Active block:** ${fmt(activeBlock.start)}–${fmt(activeBlock.end)} · **${activeBlock.kind}** · profile=${activeBlock.profile.mode}`,
	);
	dv.paragraph(`_${explainKind(activeBlock.kind)}_`);

	// If we’re currently inside a scheduled task, show it.
	if (active && active.kind === "task") {
		renderTaskLine(dv, "Do now", active.task.visual);
		return;
	}

	// Otherwise show the *next* task scheduled inside this block (if any)
	const nextTask =
		schedule.items.find(it => {
			if (it.kind !== "task") {
				return false;
			}
			if (!inInterval(it.start, activeBlock.start, activeBlock.end)) {
				return false;
			}
			return it.start.isSameOrAfter(now);
		}) ?? null;

	if (nextTask && nextTask.kind === "task") {
		renderTaskLine(dv, "Next task in block", nextTask.task.visual);
		return;
	}

	// If no tasks were placed, show block guidance
	switch (activeBlock.kind) {
		case "op:b5-execute":
			dv.paragraph(
				"No executable task was placed here (likely missing durations or blocked). Consider workshop.",
			);
			break;
		case "op:b4-workshop":
			dv.paragraph("Pick 1–3 tasks from B4 candidates: add ⏱️, split, unblock, or park parents.");
			break;
		case "op:b2-judge":
			dv.paragraph(
				"Open B2 view and decide next operator for top candidates (commit/workshop/embargo/hold).",
			);
			break;
		case "op:b3-close":
			dv.paragraph("Open B3 view and close one authority task (accept / negotiate / refuse).");
			break;
		case "governance:r0":
			dv.paragraph(
				"Do R0 now: choose 1–2 bounded actions today (priority contest), then return here.",
			);
			break;
		case "governance:b5-commit":
			const engine = new DecisionEngine(options);
			const candidates = engine.collectB5Candidates(schedule.allTasks);

			// Apply block constraints (authority gate + rough fit)
			const filtered = candidates.filter(t => {
				if (activeBlock.allowAuthority === false && t.isAuthority) {
					return false;
				}
				const m = t.duration?.asMinutes();
				return Number.isFinite(m) && (m ?? 0) > 0;
			});

			// Sort by urgency then score (simple and explainable)
			filtered.sort((a, b) => {
				const ua = computeSchedulingHint(a).urgency;
				const ub = computeSchedulingHint(b).urgency;
				const ord = { low: 0, medium: 1, high: 2, critical: 3 } as const;
				return ord[ub] - ord[ua] || b.score - a.score;
			});

			const top = filtered.slice(0, 5);

			if (!top.length) {
				dv.paragraph(
					"No eligible B5 candidates found (likely missing durations or blocked). Open B4 to repair.",
				);
			} else {
				dv.paragraph("**Top eligible tasks to commit (#b5):**");
				for (const t of top) {
					dv.paragraph(`- ${t.visual}`);
				}
				dv.paragraph(
					"_Pick 1–3 and tag #b5. Then the execute blocks will pull from committed tasks first._",
				);
			}

			break;
		default:
			dv.paragraph("Follow the block intent.");
	}
}
