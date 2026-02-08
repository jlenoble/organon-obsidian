import type { ExtendedDecisionOptions } from "../decision-options";
import type { DayViewOptions } from "./schedule-day";
import type { DayContext } from "./schedule-types";

export function atToday(now: moment.Moment, hhmm: string): moment.Moment {
	const [hh, mm] = hhmm.split(":").map(x => Number(x));
	return now.clone().hours(hh).minutes(mm).seconds(0).milliseconds(0);
}

/**
 * We build a local day context for planning.
 * We keep defaults conservative and easily overrideable from DVJS call sites.
 */
export function buildDayContext(options: ExtendedDecisionOptions & DayViewOptions): DayContext {
	const schedule = options.schedule;
	const now = window.moment();

	const dayStart = atToday(now, schedule?.workHours?.start ?? "09:00");
	const dayEnd = atToday(now, schedule?.workHours?.end ?? "19:00");

	const lunchStart = atToday(now, schedule?.lunch?.start ?? "12:30");
	const lunchMinutes = schedule?.lunch?.minutes ?? 45;

	return {
		now,
		dayStart,
		dayEnd,
		lunchStart,
		lunchMinutes,
		isR0Done: schedule?.isR0Done ?? false,
		hasB5: schedule?.hasB5 ?? false,
		weekday: now.day(),
	};
}
