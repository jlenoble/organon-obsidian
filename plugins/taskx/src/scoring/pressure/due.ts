import { type Dimensions, max } from "../dimensions";
import type { Pressure } from "../types";
import { daysBetween } from "./days-between";

export function computeDimensionsFromDueDate(
	{ dueDate }: { dueDate: TaskDate },
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	return max({ gain: 0, pressure: pressureFromDueDate(dueDate), friction: 0 }, priorDimensions);
}

export function pressureFromDueDate(due: TaskDate): Pressure {
	const daysUntil = daysBetween(window.moment(), due);

	if (daysUntil <= 1) {
		// due tomororrow, today or overdue
		return 5;
	}
	if (daysUntil <= 3) {
		return 4;
	}
	if (daysUntil <= 7) {
		return 3;
	}
	if (daysUntil <= 14) {
		return 2;
	}
	if (daysUntil <= 30) {
		return 1;
	}

	return 0;
}
