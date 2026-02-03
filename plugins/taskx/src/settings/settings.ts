import { type NormalizationOptions } from "./normalize-tag";

export interface TaskXPluginSettings extends NormalizationOptions {
	handledTags: Tag[];
}

export const DEFAULT_SETTINGS: TaskXPluginSettings = {
	handledTags: ["#routine", "#rendezvous"] as Tag[],

	looseHyphenMatching: true,
	normalizeTagsToLowercase: true,
};
