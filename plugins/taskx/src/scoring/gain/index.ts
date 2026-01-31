import type { Dimensions } from "../dimensions";

export function computeDimensionsFromExpectedGains(
	_meta: {},
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	return priorDimensions;
}
