import { type Dimensions, max } from "../dimensions";
import type { Pressure } from "../types";
import { daysBetween } from "./days-between";

export function computeDimensionsFromCreatedDate(
	{
		createdDate,
		dueDate,
		scheduledDate,
	}: { createdDate: TaskDate; dueDate: TaskDate; scheduledDate: TaskDate },
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	const pressure = pressureFromCreatedDate(createdDate);
	const mayBeObsolete = pressure === 4 && !dueDate && !scheduledDate;
	const hasBug = pressure === 5;

	return max(
		{
			gain: mayBeObsolete || hasBug ? 5 : 0, // Make sure the task floats upward if is either a bug or probably obsolete
			pressure,
			friction: 0,
		},
		priorDimensions,
	);
}

export function pressureFromCreatedDate(created: TaskDate): Pressure {
	const daysUntil = daysBetween(created, window.moment());

	if (daysUntil < 0) {
		// Bug, a task shouldn't be created in the future
		return 5;
	}
	if (daysUntil <= 1) {
		// Created today or yesterday
		return 2;
	}
	if (daysUntil <= 14) {
		// Created recently
		return 1;
	}
	if (daysUntil <= 45) {
		// Verging on obsolete
		return 2;
	}

	// Needs review
	return 4;
}
