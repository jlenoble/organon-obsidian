import { type Dimensions, max } from "./dimensions";
import type { Friction, Gain, Pressure } from "./types";

export const TAGS = ["#generic", "#rappel", "#rendez-vous", "#routine", "#tic"] as const;
export type Tag = (typeof TAGS)[number];
export const TAG_SET: Set<string> = new Set(TAGS);

export const TAG_PRIORS: Record<Tag, Dimensions> = {
	"#generic": { gain: 0, pressure: 0, friction: 0 },
	"#rappel": { gain: 1, pressure: 3, friction: 0 },
	"#rendez-vous": { gain: 1, pressure: 4, friction: 0 }, // appointments are time-constrained
	"#routine": { gain: 1, pressure: 1, friction: 1 }, // routine = low activation cost
	"#tic": { gain: 4, pressure: 4, friction: 1 }, // “inevitability increasing”: tends to matter + time pressure
};

export function isTag(tag: string): tag is Tag {
	return TAG_SET.has(tag);
}

export function computeDimensionsFromTags(
	{ tags }: { tags: readonly string[] },
	priorDimensions: Dimensions = {
		gain: 0,
		pressure: 0,
		friction: 0,
	},
): Dimensions {
	return tags
		.map(tag =>
			isTag(tag)
				? TAG_PRIORS[tag]
				: {
						gain: 0 as Gain,
						pressure: 0 as Pressure,
						friction: 0 as Friction,
					},
		)
		.reduce(max, { ...priorDimensions });
}
