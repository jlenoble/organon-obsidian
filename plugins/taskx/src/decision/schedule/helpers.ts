import type { DayContext, FixedEvent } from "./schedule-types";

export function minutesBetween(a: moment.Moment, b: moment.Moment): number {
	return Math.max(0, Math.round(window.moment.duration(b.diff(a)).asMinutes()));
}

export function clampToHorizon(ctx: DayContext, e: FixedEvent): FixedEvent | null {
	// We keep events as-is if you want full 24h. But clipping to the horizon
	// avoids weird negative / outside-day artifacts.
	const start = window.moment.max(e.start, ctx.dayStart);
	const end = window.moment.min(e.end, ctx.dayEnd);
	if (!end.isAfter(start)) {
		return null;
	}
	return { ...e, start, end };
}
