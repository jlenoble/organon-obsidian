function fnv1a32(str: string): string {
	let h = 0x811c9dc5; // offset basis
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193); // FNV prime
	}
	// unsigned + compact hex
	return (h >>> 0).toString(16).padStart(8, "0");
}

export function normalizePath(p: string): string {
	return p.replace(/\\/g, "/").trim();
}

export function normalizeTaskText(s: string): string {
	return s
		.replace(/^\s*- \[[ xX]\]\s*/, "")
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+/g, " ") // collapse spaces
		.replace(/\s+\n/g, "\n") // clean end-of-line spaces
		.trim();
}

export function makeTempTaskId(path: string, textLike: string): string {
	const key = `${normalizePath(path)}\n${normalizeTaskText(textLike)}`;
	return fnv1a32(key);
}
