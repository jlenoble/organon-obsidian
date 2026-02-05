import { defaultDimensions, type Dimensions } from "../scoring";
import type { MeaningId, MeaningSpec } from "./meaning";
import { type NormalizationOptions } from "./normalize-tag";
import { type ResolvePolicy } from "./tag-lexicon-resolver";

export interface TaskXPluginSettings extends NormalizationOptions {
	meaningSpecs: MeaningSpec[];
	fallbackDefaults: Dimensions;
	locale: Locale;
	resolvePolicy: ResolvePolicy;
}

export const DEFAULT_SETTINGS: TaskXPluginSettings = {
	meaningSpecs: [
		{
			id: "routine" as MeaningId,
			dimensions: defaultDimensions(),
			languages: {},
			neutralAliases: ["#routine"] as Tag[],
		},
		{
			id: "rendezvous" as MeaningId,
			dimensions: defaultDimensions(),
			languages: {
				fr: {
					canonical: "#rendez-vous" as Tag,
					aliases: [],
					labelKey: "",
					descriptionKey: "",
				},
			},
			neutralAliases: ["#rendezvous"] as Tag[],
		},
	],

	fallbackDefaults: defaultDimensions(),

	locale: "en" as Locale,
	resolvePolicy: "locale+neutral",

	normalizeTagsToLowercase: true,
	removeHyphensAndUnderscores: false,
};
