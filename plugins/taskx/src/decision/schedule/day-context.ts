import type { ExtDvTask, ExtendedDecisionOptions } from "../decision-options";
import type { DayViewOptions } from "./build-schedule";
import { isR0DoneFromTasks } from "./r0-detector";
import type { DayContext } from "./schedule-types";

export function parseTimeToday(now: moment.Moment, hhmm: string): moment.Moment {
	const [h, m] = hhmm.split(":").map(x => parseInt(x, 10));
	return now.clone().hour(h).minute(m).second(0).millisecond(0);
}

export function detectHasB5(tasks: ExtDvTask[]): boolean {
	return tasks.some(t => (t.taskx.tags ?? []).some(x => x === "#b5" || x === "#B5"));
}

/**
 * We build a local day context for planning.
 * We keep defaults conservative and easily overrideable from DVJS call sites.
 */
export function buildDayContext(
	options: ExtendedDecisionOptions & DayViewOptions,
	tasks: ExtDvTask[],
): DayContext {
	const schedule = options.schedule;
	const now = window.moment();

	const horizonStart = schedule?.workHours?.start ?? "07:30";
	const horizonEnd = schedule?.workHours?.end ?? "23:30";

	const dayStart = parseTimeToday(now, horizonStart);
	const dayEnd = parseTimeToday(now, horizonEnd);

	const lunchStartStr = schedule?.lunch?.start ?? "12:30";
	const lunchMinutes = schedule?.lunch?.minutes ?? 45;
	const lunchStart = parseTimeToday(now, lunchStartStr);

	const hasB5 = options.schedule?.hasB5 ?? (tasks ? detectHasB5(tasks) : false);

	const r0 = isR0DoneFromTasks({
		now,
		tasks,
		r0Tags: ["#r0", "#R0"],
	});

	return {
		now,
		dayStart,
		dayEnd,
		lunchStart,
		lunchMinutes,
		isR0Done: r0.isDone,
		hasB5,
		weekday: now.day(),
	};
}
