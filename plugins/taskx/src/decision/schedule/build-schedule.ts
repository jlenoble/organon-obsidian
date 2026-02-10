import { allDvTasks } from "../all-dvtasks";
import type { ExtendedDecisionOptions } from "../decision-options";
import { buildDayContext } from "./day-context";
import { loadDayProfilesConfig } from "./day-profiles-io";
import { fillDaySchedule } from "./fill";
import { expandWithLogistics } from "./logistics";
import { compileBlocksFromProfile } from "./profile-compile";
import { DEFAULT_DAY_PROFILE_SETTINGS } from "./profile-defaults";
import { selectGrandProfile } from "./profile-select";
import type { DaySchedule, ScheduleOptions } from "./schedule-types";
import { buildFixedEvents, computeFreeSlots } from "./timeline";

export type DayViewOptions = { schedule?: ScheduleOptions };

export function buildDayScheduleObject(
	options: ExtendedDecisionOptions & DayViewOptions,
): DaySchedule {
	const tasks = Array.from(allDvTasks(options));
	const ctx = buildDayContext(options, tasks);

	const fixed0 = buildFixedEvents(ctx, tasks, options.schedule);
	const expanded = expandWithLogistics(ctx, fixed0, options.schedule);
	const fixed = expanded.fixed;

	const free = computeFreeSlots(ctx, fixed);

	const loaded = loadDayProfilesConfig({
		raw: options.settings.dayProfiles, // after your injected default fix
		defaults: DEFAULT_DAY_PROFILE_SETTINGS,
	});

	const selected = selectGrandProfile(ctx, loaded.settings);

	const compiled = compileBlocksFromProfile({
		ctx,
		freeSlots: free,
		settings: loaded.settings,
		profile: selected,
	});

	const schedule: DaySchedule = {
		context: ctx,
		fixed,
		blocks: compiled.blocks,
		items: [],
		diagnostics: [
			...(expanded.diagnostics ?? []),
			...loaded.diagnostics,
			...compiled.diagnostics,
			`ℹ grandProfile: ${selected.id}`,
		],
		allTasks: tasks,
	};

	schedule.items = fillDaySchedule(options, schedule, tasks);
	return schedule;
}
