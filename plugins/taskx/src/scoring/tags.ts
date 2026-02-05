import { resolveDimensions } from "../settings";
import { type ExtendedOptions } from "../utils";
import { type Dimensions, max } from "./dimensions";

export function computeDimensionsFromTags(
	{ tags }: { tags: readonly string[] },
	{ resolver, settings }: ExtendedOptions,
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	return tags
		.map(tag =>
			resolveDimensions({
				...settings,
				resolver,
				tag,
			}),
		)
		.reduce(max, { ...priorDimensions });
}
