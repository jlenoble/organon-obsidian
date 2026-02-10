/**
 * core/model/fix.ts
 *
 * This file defines how the TaskX core represents “fixes”:
 * proposals to change the current state of tasks or notes in order to
 * remove blockers, improve structure, or make progress possible.
 *
 * Important conceptual split:
 * - A FixAction is an atomic, domain-level intent (e.g., “set duration to 15m”).
 * - A FixCandidate is a user-facing option, usually bundling one or more FixAction,
 *   and carrying metadata for ranking and presentation.
 *
 * Also recall the ID distinction (see id.ts):
 * - FixId identifies a fix *recipe* (shared option, e.g., "fix:set-duration-15m").
 * - FixCandidateId identifies a concrete *instance* of that recipe in the feed,
 *   typically tied to a specific task/issue/context.
 *
 * This file is deliberately domain-only:
 * - No markdown patching logic.
 * - No UI logic.
 * - No Obsidian APIs.
 */

import type { FixId, FixCandidateId } from "./id";

/**
 * How confident we are that this fix can be applied safely and automatically.
 *
 * Convention:
 * - 0: very uncertain / purely advisory
 * - 1: low confidence (likely needs user review)
 * - 2: medium confidence (reasonable default, but still a choice)
 * - 3: high confidence (safe to auto-apply in most cases)
 *
 * Notes:
 * - We keep this numeric and small on purpose to make ranking and policy tuning easy.
 */
export type FixConfidence = 0 | 1 | 2 | 3;

/**
 * Qualitative impact of a fix on the overall situation.
 *
 * Notes:
 * - This is not a score; it is a coarse signal used by ranking policies.
 * - We keep it intentionally small and descriptive.
 */
export type FixImpact = "low" | "medium" | "high";

/**
 * Atomic, domain-level fix action.
 *
 * This represents *what* we want to change, not *how* we change the file.
 * Translation to concrete file edits (PatchOps) happens later in the pipeline.
 *
 * For the first milestone, we only define one action:
 * - set-duration
 *
 * More actions will be added over time, for example:
 * - add-tag / remove-tag
 * - add-dependency
 * - spawn-template
 * - park-task
 */
export type FixAction = {
	type: "set-duration";
	minutes: number;
};

/**
 * A FixCandidate is a concrete option presented to the user.
 *
 * Characteristics:
 * - It has a unique instance id (FixCandidateId) for UI/actions.
 * - It references a shared recipe id (FixId) to identify the kind of fix.
 * - It bundles one or more FixAction that will be applied together.
 * - It carries metadata (confidence, impact, label) for ranking and display.
 */
export interface FixCandidate {
	/**
	 * Unique identifier for this concrete fix instance in the current feed.
	 *
	 * Notes:
	 * - This should be unique even if the same recipe is proposed for multiple tasks.
	 * - Typical shape: "fixcand:<issueId>:<fixId>" or similar.
	 */
	id: FixCandidateId;

	/**
	 * Identifier of the fix recipe (shared option).
	 *
	 * Examples:
	 * - "fix:set-duration-15m"
	 * - "fix:add-tag:#b5"
	 */
	recipeId: FixId;

	/**
	 * Human-readable label for UI presentation.
	 *
	 * Examples:
	 * - "Set duration to 15 minutes"
	 * - "Add #b5 tag"
	 */
	label: string;

	/** Confidence level for automatic or guided application. */
	confidence: FixConfidence;

	/** Expected qualitative impact if this fix is applied. */
	impact: FixImpact;

	/**
	 * Atomic actions that will be executed together if this fix is chosen.
	 *
	 * Notes:
	 * - Ordering matters if multiple actions are present.
	 * - For now, most fixes will contain exactly one action.
	 */
	actions: FixAction[];
}
