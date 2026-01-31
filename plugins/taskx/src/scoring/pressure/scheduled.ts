import { type Dimensions, max } from "../dimensions";
import type { Pressure } from "../types";
import { daysBetween } from "./days-between";

export function computeDimensionsFromScheduledDate(
	{ scheduledDate }: { scheduledDate: TaskDate },
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	return max(
		{ gain: 0, pressure: pressureFromScheduledDate(scheduledDate), friction: 0 },
		priorDimensions,
	);
}

export function pressureFromScheduledDate(scheduled: TaskDate): Pressure {
	const daysUntil = daysBetween(window.moment(), scheduled);

	if (daysUntil < 0) {
		// scheduled in past: moderate “catch up”
		return 3;
	}
	if (daysUntil <= 1) {
		// scheduled tomororrow or today
		return 4;
	}
	if (daysUntil <= 7) {
		return 3;
	}
	if (daysUntil <= 14) {
		return 2;
	}

	return 1;
}
