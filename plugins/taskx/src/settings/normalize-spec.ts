import { clamp0to5, type Dimensions } from "../scoring";
import type { MeaningId, MeaningSpec } from "./meaning";
import { normalize, normalizeList, type NormalizationOptions } from "./normalize-tag";
import { type TagLexicon } from "./tag-lexicon";

export function normalizeMeaningId(raw: string, opt: NormalizationOptions): MeaningId | null {
	return normalize(raw, opt)?.slice(1) as MeaningId | null;
}

export function normalizeMeaningIdList(raw: string[], opt: NormalizationOptions): MeaningId[] {
	return raw.map(id => normalizeMeaningId(id, opt)).filter(id => id !== null);
}

export function normalizeSpec(spec: MeaningSpec, opt: NormalizationOptions): MeaningSpec | null {
	const id = normalizeMeaningId(spec.id, opt);
	if (!id) {
		return null;
	}

	const dimensions: Dimensions = {
		gain: clamp0to5(spec.dimensions.gain),
		pressure: clamp0to5(spec.dimensions.pressure),
		friction: clamp0to5(spec.dimensions.friction),
	};

	const isAuthority = spec.isAuthority ?? false;

	const languages: Partial<Record<Locale, TagLexicon>> = {};

	for (const [locale, lexicon] of Object.entries(spec.languages) as Array<[Locale, TagLexicon]>) {
		const canonical = normalize(lexicon.canonical, opt);

		if (!canonical) {
			continue;
		}

		const aliases = normalizeList(lexicon.aliases, opt);

		languages[locale] = {
			canonical,
			aliases,
			labelKey: lexicon.labelKey,
			descriptionKey: lexicon.descriptionKey,
		};
	}

	const neutralAliases: Tag[] = normalizeList(spec.neutralAliases, opt);

	return { id, dimensions, isAuthority, languages, neutralAliases };
}

export function normalizeSpecList(specs: MeaningSpec[], opt: NormalizationOptions): MeaningSpec[] {
	return specs.map(spec => normalizeSpec(spec, opt)).filter(spec => spec !== null);
}
