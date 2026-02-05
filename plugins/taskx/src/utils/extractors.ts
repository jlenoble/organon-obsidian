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

/**
 * Extract a moment.Duration from a task’s text.
 *
 * Accepted examples:
 * - ⏱️ 45m
 * - ⏱️ 1h
 * - ⏱️ 1h30
 * - ⏱️ 1h30m
 * - ⏱️ 2d
 * - ⏱️ 3w
 * - ⏱️ 1mo
 */
export function extractDuration(text: string): moment.Duration | null {
	const escaped = escapeRegExp("⏱️");

	// Capture after emoji:
	// first chunk: number + unit (mo|w|d|h|m)
	// optional second chunk: number + (h|m) to allow "1h30" or "1h30m"
	const re = new RegExp(
		`${escaped}\\s*` + `(` + `(?:\\d+\\s*(?:mo|w|d|h|m))` + `(?:\\s*\\d+\\s*(?:h|m))?` + `)`,
		"u",
	);

	const m = text.match(re);
	if (!m) {
		return null;
	}

	const raw = m[1].trim();

	return parseToMomentDuration(raw);
}

function parseToMomentDuration(raw: string): moment.Duration | null {
	// Normalize: remove spaces, lowercase
	const s = raw.replace(/\s+/g, "").toLowerCase();

	// Cases:
	// - "90m"
	// - "1h"
	// - "1h30"
	// - "1h30m"
	// - "2d", "3w", "1mo"
	//
	// We allow at most two chunks to keep the UI compact.
	const re = /^(\d+)(mo|w|d|h|m)(?:(\d+)(h|m))?$/;
	const m = s.match(re);
	if (!m) {
		return null;
	}

	const n1 = Number(m[1]);
	if (!Number.isFinite(n1)) {
		return null;
	}

	const u1 = normalizeUnit(m[2]);

	const obj: moment.DurationInputObject = { [u1]: n1 };

	if (m[3] && m[4]) {
		const n2 = Number(m[3]);
		if (!Number.isFinite(n2)) {
			return null;
		}

		const u2 = normalizeUnit(m[4]);
		obj[u2] = (obj[u2] ?? 0) + n2;
	} else {
		// Special case: "1h30" (implicit minutes)
		const implicit = s.match(/^(\d+)h(\d+)$/);
		if (implicit) {
			const hh = Number(implicit[1]);
			const mm = Number(implicit[2]);
			if (Number.isFinite(hh) && Number.isFinite(mm)) {
				obj.hours = hh;
				obj.minutes = (obj.minutes ?? 0) + mm;
			}
		}
	}

	return window.moment.duration(obj);
}

function normalizeUnit(u: string): keyof moment.DurationInputObject {
	switch (u) {
		case "m":
			return "minutes";
		case "h":
			return "hours";
		case "d":
			return "days";
		case "w":
			return "weeks";
		case "mo":
			return "months";
		default:
			// Should not happen due to regex
			return "minutes";
	}
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
