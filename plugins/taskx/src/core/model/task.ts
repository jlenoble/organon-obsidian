/**
 * core/model/task.ts
 *
 * This file defines the canonical, tool-agnostic representation of a task inside TaskX.
 *
 * Why this exists:
 * - Obsidian Tasks, Dataview, raw markdown, etc. all expose tasks differently.
 * - Our pipeline (analysis → issues → recommendations) must not depend on any specific source API.
 * - We therefore normalize tasks into a single stable shape: TaskEntity.
 *
 * Scope:
 * - This is deliberately minimal and purely structural.
 * - No parsing logic, no graph logic, no patching logic, no UI logic.
 * - Anything “computed” belongs in facts.ts (derived data), not here.
 */

import type { TaskId } from "./id";

/**
 * ISO calendar date string, without time.
 *
 * Examples:
 * - "2026-02-10"
 *
 * Notes:
 * - We intentionally keep this as an unconstrained string for now.
 * - Validation/parsing belongs in adapters/utilities to avoid coupling the core model
 *   to a particular date library or strict formatting rules too early.
 */
export type ISODate = string;

/**
 * Task duration in minutes.
 *
 * Notes:
 * - We use minutes as the canonical unit because it supports both short and long tasks
 *   while remaining easy to reason about in planning and scoring.
 */
export type Minutes = number;

/**
 * Where a task came from in the vault.
 *
 * This is the minimal information needed to:
 * - render helpful provenance in the UI ("from <path>")
 * - later apply patches back to the correct note/line
 *
 * Notes:
 * - `line` is optional because some sources only provide a block reference or no location.
 * - We keep it as a 1-based line number by convention (human-friendly).
 *   If an adapter uses 0-based indexing, it must convert at the boundary.
 */
export interface TaskOrigin {
	/**
	 * Open-world discriminator for the origin semantics.
	 *
	 * Examples:
	 * - "vault-markdown" (a markdown task line in a note)
	 * - "generated" (a synthetic task produced by TaskX)
	 *
	 * Notes:
	 * - This field exists for provenance, patching strategy, and diagnostics.
	 * - Core and pipeline logic must treat this as data only and avoid branching
	 *   on it. Branching is reserved for adapters and patch application.
	 */
	kind: string;

	path: string;
	line?: number;
}

/**
 * Canonical task entity used throughout the TaskX core pipeline.
 *
 * Key principles:
 * - TaskEntity is “what the world is”; it represents current known state.
 * - TaskEntity is not “what we think should be done”; that belongs to issues/recommendations.
 * - Raw markdown is retained to support later patch application without re-parsing the file.
 *
 * Minimal fields only:
 * - We intentionally avoid "basins", "profiles", or "blocks" here.
 * - Those are projections/suggestions derived from facts and policies, not intrinsic properties.
 */
export interface TaskEntity {
	/**
	 * Canonical identifier for this task within the current pipeline run.
	 *
	 * Notes:
	 * - ID generation strategy is defined at the collection boundary (adapters).
	 * - For now, it may be a hash of (path + normalized text + line), or any deterministic scheme.
	 * - Stability across refreshes matters for UI continuity and deduplication.
	 */
	id: TaskId;

	/** Provenance in the vault (note path and optional line number). */
	origin: TaskOrigin;

	/**
	 * Human-readable task text (normalized).
	 *
	 * Examples:
	 * - "Buy groceries"
	 * - "Reply to admin emails"
	 *
	 * Notes:
	 * - This should exclude checkboxes, IDs, and any machine markers.
	 * - Exact normalization rules are defined by adapters/utilities.
	 */
	text: string;

	/**
	 * Completion status.
	 *
	 * Notes:
	 * - We keep this binary for now because it is sufficient for our initial pipeline.
	 * - We can extend later if we want "cancelled", "in-progress", etc., but we do not
	 *   want to prematurely mirror every upstream plugin state machine.
	 */
	status: "todo" | "done";

	/**
	 * Tags associated with the task (already normalized).
	 *
	 * Notes:
	 * - Normalization rules (lowercasing, hyphen/underscore equivalence, etc.) are policy-driven
	 *   and should be applied at collection time.
	 * - We use Set<string> for fast membership checks in detectors and policies.
	 */
	tags: Set<string>;

	/**
	 * Estimated duration in minutes.
	 *
	 * Notes:
	 * - Missing duration is a common blocker and will be detected as an issue.
	 * - We treat presence/absence as meaningful; 0 is not a valid duration.
	 */
	duration?: Minutes;

	/**
	 * Structured dates (optional).
	 *
	 * Notes:
	 * - We keep only date-level granularity for now. Time-of-day can be introduced later
	 *   if needed, but many user workflows remain date-based.
	 * - Inconsistencies (e.g., due < scheduled) are handled in issue detection.
	 */
	dates: {
		scheduled?: ISODate;
		due?: ISODate;
		start?: ISODate;
	};

	/**
	 * Raw source material retained for later patching/debugging.
	 *
	 * Notes:
	 * - `markdown` should contain the original task line (or block) as obtained by the adapter.
	 * - We avoid storing the entire file content here; that belongs to patch planning/apply.
	 */
	raw: {
		markdown: string;
	};
}
