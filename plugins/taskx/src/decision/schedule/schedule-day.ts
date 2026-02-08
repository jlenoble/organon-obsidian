import { allDvTasks } from "../all-dvtasks";
import { buildDayContext } from "./day-context";
import type { ExtendedDecisionOptions } from "../decision-options";
import { buildBlockPlan } from "./block-plan";
import { fillDaySchedule } from "./fill";
import { expandWithLogistics } from "./logistics";
import { renderDaySchedule } from "./render";
import type { DaySchedule, ScheduleOptions } from "./schedule-types";
import { buildFixedEvents, computeFreeSlots } from "./timeline";

/**
 * We expose schedule options via `decision({ viewName: "day", schedule: ... })`.
 * This avoids adding a whole new top-level API surface right now.
 */
export type DayViewOptions = {
	schedule?: ScheduleOptions;
};

export function scheduleDay(options: ExtendedDecisionOptions & DayViewOptions): void {
	const tasks = Array.from(allDvTasks(options)); // DataArray -> array for reuse in multiple passes

	const ctx = buildDayContext(options);

	// 1) Build fixed events (rendezvous, meals, etc.)
	const fixed0 = buildFixedEvents(ctx, tasks, options.schedule);

	// 2) Expand with logistics envelopes (prep/travel/recover)
	const expanded = expandWithLogistics(ctx, fixed0, options.schedule);
	const fixed = expanded.fixed;

	// 3) Compute free slots from the full fixed timeline
	const free = computeFreeSlots(ctx, fixed);

	// 4) Build block plan (operations over free slots)
	const plan = buildBlockPlan(ctx, free, {
		executeDeepMinutes: options.schedule?.executeDeepMinutes,
		executeShallowMinutes: options.schedule?.executeShallowMinutes,
		workshopMinutes: options.schedule?.workshopMinutes,
		closeMinutes: options.schedule?.closeMinutes,
		bufferMinutes: options.schedule?.bufferMinutes,
		r0Minutes: options.schedule?.r0Minutes,
		b5CommitMinutes: options.schedule?.b5CommitMinutes,
	});

	// 5) Assemble schedule object
	const schedule: DaySchedule = {
		context: ctx,
		fixed,
		blocks: plan.blocks,
		items: [],
		diagnostics: [
			...expanded.diagnostics, // logistics issues (overlaps, impossible envelopes, etc.)
			...plan.diagnostics, // planning issues (R0 gate, missing slots, etc.)
		],
	};

	// 6) Fill blocks with tasks (pure proposal, no mutation)
	schedule.items = fillDaySchedule(options, schedule, tasks);

	// 7) Render
	renderDaySchedule(options.dv, schedule);
}
