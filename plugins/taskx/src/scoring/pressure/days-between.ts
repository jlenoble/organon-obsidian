export function daysBetween(a: TaskDate, b: TaskDate): number {
	if (!window.moment.isMoment(a) || !window.moment.isMoment(b)) {
		return NaN;
	}
	// Normalize to start of day to avoid partial-day drift
	const start = a.clone().startOf("day");
	const end = b.clone().startOf("day");

	const duration = window.moment.duration(end.diff(start));

	return duration.asDays(); // can be negative
}
