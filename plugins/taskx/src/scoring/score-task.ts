import type { ExtendedOptions, TaskX } from "../utils";
import type { Dimensions } from "./dimensions";
import { computeDimensionsFromFrictions } from "./friction";
import { computeDimensionsFromExpectedGains } from "./gain";
import { computeDimensionsFromTimeConstraints } from "./pressure";
import { computeDimensionsFromTags } from "./tags";
import type { Score } from "./types";

export interface ScoredTask {
	id: TaskXId;
	dimensions: Dimensions;
	score: Score;
}

export function computePriorityScore(d: Dimensions): Score {
	// Priority = (G * P) / (1 + F)
	return (d.gain * d.pressure) / (1 + d.friction);
}

export function scoreTask(taskx: TaskX, options: ExtendedOptions): ScoredTask {
	let dimensions = computeDimensionsFromTags(taskx, options);
	dimensions = computeDimensionsFromExpectedGains(taskx, dimensions);
	dimensions = computeDimensionsFromTimeConstraints(taskx, dimensions);
	dimensions = computeDimensionsFromFrictions(taskx, options, dimensions);

	const score = computePriorityScore(dimensions);

	return {
		id: taskx.id,
		dimensions,
		score,
	};
}
