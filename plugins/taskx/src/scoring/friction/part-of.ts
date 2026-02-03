import { type ExtendedOptions } from "../../utils";
import { type Dimensions } from "../dimensions";
import { type Friction } from "../types";

export function computeDimensionsFromPartOfRelation(
	{ id, parentId }: { id: TaskXId; parentId: TaskXId | null },
	{ graphs: { partOf } }: ExtendedOptions,
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	let { friction } = priorDimensions;
	const { gain, pressure } = priorDimensions;

	// Task already decomposed, is a smaller part, so lesser burden
	if (parentId) {
		friction = Math.max(0, friction - 1) as Friction;
	}

	// Task already decomposed, has parts, so greater burden
	if (partOf.neighbors(id, "partOf", "in").length > 0) {
		friction = Math.min(5, friction + 1) as Friction;
	}

	return { gain, pressure, friction };
}
