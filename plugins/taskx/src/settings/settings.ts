import type { MeaningId, MeaningSpec } from "./meaning";
import { type NormalizationOptions } from "./normalize-tag";
import { type ResolvePolicy } from "./tag-lexicon-resolver";
import { DEFAULT_DAY_PROFILE_SETTINGS } from "../decision/schedule/profile-defaults";
import type { DayProfileSettings } from "../decision/schedule/profile-types";
import { defaultDimensions, type Dimensions } from "../scoring";

export interface TaskXPluginSettings extends NormalizationOptions {
	meaningSpecs: MeaningSpec[];
	fallbackDefaults: Dimensions;
	locale: Locale;
	resolvePolicy: ResolvePolicy;
	dayProfiles?: DayProfileSettings;
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

	dayProfiles: DEFAULT_DAY_PROFILE_SETTINGS,
};
