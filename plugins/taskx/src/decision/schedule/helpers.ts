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

export function atToday(now: moment.Moment, hhmm: string): moment.Moment {
	const [h, m] = hhmm.split(":").map(x => parseInt(x, 10));
	return now.clone().hour(h).minute(m).second(0).millisecond(0);
}

export function fmt(t: moment.Moment): string {
	// moment-like formatting
	return t.format("HH:mm");
}
