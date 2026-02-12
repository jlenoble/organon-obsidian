/**
 * adapters/obsidian/extract-task-id.ts
 *
 * This file provides a tiny, mechanical parser for an explicit task id marker.
 *
 * We keep this logic in the adapter layer because it is a markdown convention,
 * not a core domain concept. The core model only requires that TaskEntity has
 * an id; how it is sourced is an ingestion concern.
 *
 * The current convention:
 * - "🆔 <value>"
 *
 * The extracted value is treated as an opaque token. Validation (if any) should
 * be performed by higher-level policies or issue detectors, not here.
 */

/**
 * Extract the 🆔 value from a task’s raw text.
 *
 * Examples:
 * - "Pay rent 🆔 20250824134256" -> "20250824134256"
 * - "Pay rent 🆔 abc_DEF-12"     -> "abc_DEF-12"
 * - "Pay rent"                   -> null
 */
export function extractTaskId(text: string): string | null {
	// We only accept a conservative character class to avoid accidental capture of
	// punctuation that tends to terminate markers in markdown.
	const m = text.match(/🆔\s*([A-Za-z0-9_-]+)/u);
	return m ? m[1] : null;
}
