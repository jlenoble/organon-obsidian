import { atToday, minutesBetween } from "./helpers";
import type { BlockRecipe, DayProfileSettings, GrandProfile } from "./profile-types";
import type { DayContext, FreeSlot, TimeBlockPlan } from "./schedule-types";

export function clampToFreeSlots(
	ctx: { now: moment.Moment },
	freeSlots: { start: moment.Moment; end: moment.Moment }[],
	minutes: number,
): { start: moment.Moment; end: moment.Moment } | null {
	// pick the earliest slot that intersects "now"
	for (const s of freeSlots) {
		const start = window.moment.max(s.start, ctx.now);
		const end = s.end.clone();
		if (end.isAfter(start) && minutesBetween(start, end) >= minutes) {
			return { start, end: start.clone().add(minutes, "minutes") };
		}
	}
	return null;
}

export function intersects(
	a0: moment.Moment,
	a1: moment.Moment,
	b0: moment.Moment,
	b1: moment.Moment,
): boolean {
	return a0.isBefore(b1) && b0.isBefore(a1);
}

export function clipInterval(
	start: moment.Moment,
	end: moment.Moment,
	clipStart: moment.Moment,
	clipEnd: moment.Moment,
): { start: moment.Moment; end: moment.Moment } | null {
	const s = window.moment.max(start, clipStart);
	const e = window.moment.min(end, clipEnd);
	return e.isAfter(s) ? { start: s, end: e } : null;
}

export function shouldApplyRecipe(ctx: DayContext, r: BlockRecipe): boolean {
	const when = r.when;
	if (!when || when.kind === "always") {
		return true;
	}
	if (when.kind === "weekday") {
		return when.days.includes(ctx.weekday);
	}
	if (when.kind === "weekend") {
		return ctx.weekday === 0 || ctx.weekday === 6;
	}
	if (when.kind === "dateRange") {
		const today = ctx.now.format("YYYY-MM-DD");
		return today >= when.startISO && today <= when.endISO;
	}
	return true;
}

export function splitIntoBlocks(
	start: moment.Moment,
	end: moment.Moment,
	minutes: number,
	mk: (s: moment.Moment, e: moment.Moment, m: number) => TimeBlockPlan,
): TimeBlockPlan[] {
	const out: TimeBlockPlan[] = [];
	let cursor = start.clone();
	while (cursor.isBefore(end)) {
		const next = window.moment.min(cursor.clone().add(minutes, "minutes"), end.clone());
		const m = minutesBetween(cursor, next);
		if (m <= 0) {
			break;
		}
		out.push(mk(cursor.clone(), next.clone(), m));
		cursor = next;
	}
	return out;
}

/**
 * Compile selected grand profile into concrete blocks, projected onto free slots.
 *
 * v1 policy:
 * - Each recipe defines a window [start,end]
 * - We intersect that window with each free slot interval
 * - We split the intersection into chunkMinutes blocks
 * - If multiple recipes overlap, we keep stable ordering by (priority, start time)
 *
 * We do NOT do “reordering” beyond that yet. This keeps it deterministic.
 */
export function compileBlocksFromProfile(args: {
	ctx: DayContext;
	freeSlots: FreeSlot[];
	settings: DayProfileSettings;
	profile: GrandProfile;
}): { blocks: TimeBlockPlan[]; diagnostics: string[] } {
	const diagnostics: string[] = [];

	const packs = args.profile.packIds
		.map(id => args.settings.packs.find(p => p.id === id))
		.filter(Boolean); // inside compileBlocksFromProfile(...) before compiling recipes

	if (!args.ctx.isR0Done) {
		const r0Min = args.profile.schedule?.r0Minutes ?? 35;
		const slot = clampToFreeSlots(args.ctx, args.freeSlots, Math.min(r0Min, 90));
		if (!slot) {
			return { blocks: [], diagnostics: ["R0 not done but no free slot available in horizon."] };
		}

		const b: TimeBlockPlan = {
			kind: "governance:r0",
			start: slot.start,
			end: slot.end,
			minutes: minutesBetween(slot.start, slot.end),
			label: "R0 — decision rail",
			profile: { mode: "admin" },
			allowAuthority: true,
			minUrgency: "low",
		};

		return {
			blocks: [b],
			diagnostics: ["R0 not done → governance only (R0)."],
		};
	}

	const recipes: BlockRecipe[] = [];
	for (const p of packs) {
		recipes.push(...(p!.recipes ?? []));
	}

	const applicable = recipes.filter(r => shouldApplyRecipe(args.ctx, r));

	// For each recipe, project it onto free slots
	const blocks: TimeBlockPlan[] = [];
	for (const r of applicable) {
		const wStart = atToday(args.ctx.now, r.window.start);
		const wEnd = atToday(args.ctx.now, r.window.end);

		for (const slot of args.freeSlots) {
			if (!intersects(wStart, wEnd, slot.start, slot.end)) {
				continue;
			}

			const clipped = clipInterval(wStart, wEnd, slot.start, slot.end);
			if (!clipped) {
				continue;
			}

			blocks.push(
				...splitIntoBlocks(clipped.start, clipped.end, r.chunkMinutes, (s, e, m) => ({
					kind: r.kind,
					start: s,
					end: e,
					minutes: m,
					label: r.label,
					profile: r.profile,
					allowAuthority: r.allowAuthority,
					minUrgency: r.minUrgency,
					maxTasks: r.maxTasks,
				})),
			);
		}
	}

	// Stable ordering: by start time, then by priority, then by kind
	const prio = new Map<string, number>();
	for (const r of applicable) {
		prio.set(r.id, r.priority ?? 9999);
	}

	blocks.sort((a, b) => {
		const t = a.start.valueOf() - b.start.valueOf();
		if (t) {
			return t;
		}
		// label is not unique; we can’t map back perfectly. v1: kind/profile tie-breaker
		return a.kind.localeCompare(b.kind) || a.profile.mode.localeCompare(b.profile.mode);
	});

	// Gate behavior remains in fill.ts: if R0 isn’t done, we show only governance.
	// But we can add a diagnostic if no governance block exists.
	if (!blocks.some(b => b.kind === "governance:r0")) {
		diagnostics.push("No governance:r0 block produced by profile recipes.");
	}

	return { blocks, diagnostics };
}
