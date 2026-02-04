import { type NormalizationOptions, normalize } from "./normalize-tag";

export type TagLexicon = {
	/**
	 * Canonical tags to *emit* or display as primary in this language.
	 */
	canonical: Tag;

	/**
	 * Accepted tags for this language that map to the same meaning,
	 * but are not the preferred output.
	 */
	aliases: Tag[];

	// presentation (i18n)
	labelKey: string;
	descriptionKey: string;
};

export function defaultLexicon(options: NormalizationOptions): TagLexicon {
	return {
		canonical: normalize("#tag", options) ?? ("#tag" as Tag),
		aliases: [],
		labelKey: "",
		descriptionKey: "",
	};
}
