/** Extract the 🆔 value from a task’s text */
export function extractId(text: string): string | null {
	const m = text.match(/🆔\s*([A-Za-z0-9_-]+)/);
	return m ? m[1] : null;
}

/** Extract the parent reference from 🌿 */
export function extractParentId(text: string): string | null {
	const m = text.match(/🌿\s*([A-Za-z0-9_-]+)/);
	return m ? m[1] : null;
}

export function extractIdsByEmoji(text: string, emoji: string): string[] {
	// Escape emoji for regex safety (some emojis include regex meta via surrogate pairs)
	const escaped = escapeRegExp(emoji);

	// Match: 🌿id1,id2,id3
	// No spaces allowed between ids, but optional spaces after emoji
	const re = new RegExp(`${escaped}\\s*([A-Za-z0-9_-]+(?:,[A-Za-z0-9_-]+)*)`);

	const m = text.match(re);
	if (!m) {
		return [];
	}

	return m[1].split(",");
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
