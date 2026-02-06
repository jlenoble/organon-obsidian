import { type Dimensions } from "../scoring";
import { type TagLexicon } from "./tag-lexicon";

export type MeaningId = Brand<string, "MeaningId">; // stable internal key, e.g. "tic"

export type MeaningSpec = {
	id: MeaningId;

	// what it means in scoring terms
	dimensions: Dimensions;

	/** Marks this tag family as representing an external/authority constraint (B3 domain).
	 *  Default: false. We only treat tasks as "authority" when this is explicitly set.
	 */
	isAuthority?: boolean;

	/**
	 * Clean separation: each language has its own lexicon.
	 * Example: fr:{canonical:["#rappel"],aliases:["#remind"]} etc
	 */
	languages: Partial<Record<Locale, TagLexicon>>;

	/**
	 * Optional: language-neutral aliases (legacy, shorthand, cross-locale noise).
	 * These are accepted regardless of UI language.
	 */
	neutralAliases: Tag[];
};
