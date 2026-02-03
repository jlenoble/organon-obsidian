import type { ExtendedOptions } from "../../utils";
import { type Dimensions } from "../dimensions";
import { computeDimensionsFromPartOfRelation } from "./part-of";

export function computeDimensionsFromFrictions(
	meta: { id: TaskXId; parentId: TaskXId | null },
	options: ExtendedOptions,
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	const dimensions = computeDimensionsFromPartOfRelation(meta, options, priorDimensions);

	return dimensions;
}

export * from "./part-of";
