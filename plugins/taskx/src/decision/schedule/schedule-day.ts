import type { ExtendedDecisionOptions } from "../decision-options";
import { buildDayScheduleObject, type DayViewOptions } from "./build-schedule";
import { renderDaySchedule } from "./render";

export function scheduleDay(options: ExtendedDecisionOptions & DayViewOptions): void {
	const schedule = buildDayScheduleObject(options);
	renderDaySchedule(options.dv, schedule);
}
