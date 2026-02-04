import { type Dimensions } from "../scoring";
import { type TagLexicon } from "./tag-lexicon";

export type MeaningId = Brand<string, "MeaningId">; // stable internal key, e.g. "tic"

export type MeaningSpec = {
	id: MeaningId;

	// what it means in scoring terms
	dimensions: Dimensions;

	/**
	 * Clean separation: each language has its own lexicon.
	 * Example: fr:{canonical:["#rappel"],aliases:["#remind"]} etc
	 */
	languages: Record<Locale, TagLexicon>;

	/**
	 * Optional: language-neutral aliases (legacy, shorthand, cross-locale noise).
	 * These are accepted regardless of UI language.
	 */
	neutralAliases: Tag[];
};
