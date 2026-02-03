export type NormalizationOptions = {
	normalizeTagsToLowercase: boolean;
	looseHyphenMatching: boolean;
};

export function normalizeStrict(raw: string, opt: NormalizationOptions): Tag | null {
	let s = raw.trim();

	if (!s) {
		return null;
	}
	if (!s.startsWith("#")) {
		s = "#" + s;
	}

	// Reject internal whitespace
	if (/\s/.test(s)) {
		return null;
	}

	if (opt.normalizeTagsToLowercase) {
		s = s.toLowerCase();
	}

	return s as Tag;
}

export function normalizeLoose(strict: Tag, opt: NormalizationOptions): Tag {
	if (!opt.looseHyphenMatching) {
		return strict;
	}
	return strict.replace(/[-_]/g, "") as Tag;
}

export function normalize(raw: string, opt: NormalizationOptions): Tag | null {
	const tag = normalizeStrict(raw, opt);
	return tag ? normalizeLoose(tag, opt) : null;
}

export function normalizeStrictList(raw: string[], opt: NormalizationOptions): Tag[] {
	const out: Tag[] = [];
	for (const r of raw) {
		const n = normalizeStrict(r, opt);
		if (n) {
			out.push(n);
		}
	}
	return out;
}

export function normalizeLooseList(strict: Tag[], opt: NormalizationOptions): Tag[] {
	return strict.map(tag => normalizeLoose(tag, opt));
}

export function normalizeList(raw: string[], opt: NormalizationOptions): Tag[] {
	return normalizeLooseList(normalizeStrictList(raw, opt), opt);
}
