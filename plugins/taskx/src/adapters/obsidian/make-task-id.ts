/**
 * adapters/obsidian/make-task-id.ts
 *
 * This file builds a TaskId for a collected task at the adapter boundary.
 * Some tasks carry an explicit 🆔 marker in their raw text, while others do not
 * and still need a stable, deterministic identity during pipeline runs.
 *
 * We keep id sourcing here (rather than in the core) so the pipeline can stay
 * tool-agnostic and treat TaskId as opaque. The temporary id scheme is designed
 * to be detectable later, so missing explicit ids can be diagnosed without
 * blocking basic execution flows.
 *
 * Scope:
 * - Decide how a TaskId is sourced at collection time.
 * - Prefer explicit 🆔 markers when present.
 * - Otherwise derive a deterministic temporary id from stable origin signals.
 *
 * Non-goals:
 * - This does not validate ids.
 * - This does not enforce any long-term identity contract.
 * - The core and pipeline must not branch on the temp id format.
 */

import { extractTaskId } from "./extract-task-id";
import { asTaskId, type TaskId } from "../../core/model/id";

/**
 * Minimal origin information needed to build deterministic temporary ids.
 *
 * We intentionally keep this type local and structural so this helper does not
 * depend on the full core TaskOrigin shape. Adapters may evolve provenance
 * semantics independently while preserving these stable fields.
 */
export type TaskIdOrigin = {
	path: string;
	line?: number;
};

/**
 * Build a TaskId for a collected task.
 *
 * Behavior:
 * - If an explicit 🆔 marker is present, we use it verbatim.
 * - Otherwise we generate a temporary id derived from stable origin signals.
 *
 * Temporary id format (detectable by the "tmp:" prefix):
 *
 * - tmp:<path>:l:<line>
 *   We have a stable, human-facing line number (1-based by convention).
 *
 * - tmp:<path>:i:<index>
 *   We do not have a line number, but we have a stable ordering index within
 *   the same origin scope.
 *
 * - tmp:<path>:h:<hex>
 *   Last resort when no location signals are available. We use a deterministic
 *   32-bit hash of raw markdown to avoid embedding arbitrary text and to avoid
 *   delimiter ambiguity (e.g. ":" in the task text).
 *
 * Notes:
 * - These ids are not persisted as a long-term identity contract.
 * - They exist to make TaskEntity well-formed and stable across refreshes.
 * - The "tmp:" prefix keeps them easy to detect for later diagnostics.
 */
export function makeTaskId(args: {
	origin: TaskIdOrigin;
	rawMarkdown: string;
	fallbackIndex?: number;
}): TaskId {
	const { origin, rawMarkdown, fallbackIndex } = args;

	const explicit = extractTaskId(rawMarkdown);
	if (explicit) {
		return asTaskId(explicit);
	}

	// Preferred stability: use location information when it exists.
	// This keeps temp ids short and stable across refreshes.
	if (typeof origin.line === "number") {
		return asTaskId(`tmp:${origin.path}:l:${origin.line}`);
	}

	if (typeof fallbackIndex === "number") {
		return asTaskId(`tmp:${origin.path}:i:${fallbackIndex}`);
	}

	// Last resort: avoid embedding raw markdown in the id (it may contain ":" and
	// produces unbounded length). Use a deterministic hash instead.
	const h = hashStringFNV1a(rawMarkdown);
	return asTaskId(`tmp:${origin.path}:h:${h}`);
}

/**
 * Compute a small deterministic hash for a string.
 *
 * We use a 32-bit FNV-1a hash and return it as an unsigned hex string.
 *
 * Notes:
 * - This is not cryptographic and does not need to be.
 * - It is only used to reduce collision risk in last-resort temp ids.
 * - The algorithm is synchronous and stable across JS runtimes.
 */
function hashStringFNV1a(input: string): string {
	let h = 0x811c9dc5;

	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);

		// FNV prime multiplication, modulo 2^32.
		h = Math.imul(h, 0x01000193);
	}

	// Convert to an unsigned 32-bit hex string (no leading "0x").
	return (h >>> 0).toString(16);
}
