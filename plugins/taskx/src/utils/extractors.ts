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
