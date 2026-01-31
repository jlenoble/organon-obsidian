import type { Dimensions } from "../dimensions";
import { computeDimensionsFromCreatedDate } from "./created";
import { computeDimensionsFromDueDate } from "./due";
import { computeDimensionsFromScheduledDate } from "./scheduled";

export function computeDimensionsFromTimeConstraints(
	meta: { createdDate: TaskDate; dueDate: TaskDate; scheduledDate: TaskDate },
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	let dimensions = computeDimensionsFromDueDate(meta, priorDimensions);
	dimensions = computeDimensionsFromScheduledDate(meta, dimensions);
	dimensions = computeDimensionsFromCreatedDate(meta, dimensions);

	return dimensions;
}

export * from "./created";
export * from "./days-between";
export * from "./due";
export * from "./scheduled";
