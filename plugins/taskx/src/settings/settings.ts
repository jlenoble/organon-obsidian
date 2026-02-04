import { defaultDimensions } from "../scoring";
import type { MeaningId, MeaningSpec } from "./meaning";
import { type NormalizationOptions } from "./normalize-tag";

export interface TaskXPluginSettings extends NormalizationOptions {
	meaningSpecs: MeaningSpec[];
}

export const DEFAULT_SETTINGS: TaskXPluginSettings = {
	meaningSpecs: [
		{
			id: "routine" as MeaningId,
			dimensions: defaultDimensions(),
			languages: {},
			neutralAliases: [],
		},
		{
			id: "rendezvous" as MeaningId,
			dimensions: defaultDimensions(),
			languages: {},
			neutralAliases: [],
		},
	],

	looseHyphenMatching: true,
	normalizeTagsToLowercase: true,
};
