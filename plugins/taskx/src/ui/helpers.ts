export function validateMeaningId(raw: string): string | null {
	const s = raw.trim();
	if (!s) {
		return "Meaning id cannot be empty.";
	}
	// Keep this strict: internal key, no whitespace
	if (/\s/.test(s)) {
		return "Meaning id must not contain whitespace.";
	}
	if (!/^[a-z0-9_-]+$/i.test(s)) {
		return "Meaning id should be [a-z0-9_-].";
	}
	return null;
}

export function validateLocale(raw: string): string | null {
	const s = raw.trim();
	if (!s) {
		return "Locale cannot be empty.";
	}
	if (/\s/.test(s)) {
		return "Locale must not contain whitespace.";
	}

	if (!/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(s)) {
		return "Locale should look like fr or en-US.";
	}
	return null;
}

export function splitCsvOrLines(raw: string): string[] {
	return raw
		.split(/[,|\n\r]+/g)
		.map(s => s.trim())
		.filter(Boolean);
}
