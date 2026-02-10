/**
 * core/model/issue.ts
 *
 * This file defines how the TaskX core represents “issues”:
 * detected blockers, inconsistencies, or missing information that prevent tasks
 * from flowing toward execution.
 *
 * Conceptually:
 * - TaskEntity is observed state.
 * - TaskFacts are derived observations.
 * - Issue is a structured report: “something is wrong or missing, here is evidence, here are fixes”.
 *
 * Design goals:
 * - Pure: an issue reports facts; it does not apply changes.
 * - Local: issues usually target a specific task (or sometimes "global").
 * - Actionable: issues may carry suggested FixCandidates (and later wizard pointers).
 *
 * This file stays intentionally minimal; we do not define a closed IssueKind union here.
 * Extensibility is achieved by:
 * - detector IDs (kebab-case strings) living in feature folders,
 * - IssueId composition (e.g., "<issue-kind>:<taskId>") produced by detectors.
 */

import type { FixCandidate } from "./fix";
import type { IssueId, TaskId } from "./id";

/**
 * Severity conveys how strongly an issue blocks progress.
 *
 * Convention:
 * - info: nice-to-have improvements, not required for execution
 * - warn: likely to cause trouble or inefficiency
 * - blocker: prevents reasonable execution/planning until resolved
 *
 * Notes:
 * - Severity is used for ranking and grouping in the feed.
 * - It is intentionally coarse.
 */
export type IssueSeverity = "info" | "warn" | "blocker";

/**
 * Issue is a structured report produced by detectors.
 *
 * Key points:
 * - `id` is globally unique for this issue instance (often derived from kind + target).
 * - `target` identifies which task this issue applies to.
 * - `evidence` is short, human-readable bullets (not long paragraphs).
 * - `fixes` is a list of candidate resolutions (may be empty if purely diagnostic).
 */
export interface Issue {
	/**
	 * Unique identifier for this issue instance.
	 *
	 * Typical patterns:
	 * - "<issue-kind>:<taskId>"
	 * - "<issue-kind>:global"
	 *
	 * Notes:
	 * - The exact composition strategy is a detector responsibility.
	 * - We do not validate format at this layer.
	 */
	id: IssueId;

	/**
	 * The task this issue applies to.
	 *
	 * Notes:
	 * - For global issues (rare), we can introduce a dedicated GlobalTarget later.
	 * - For the initial milestone, we keep the model task-scoped.
	 */
	target: TaskId;

	/** Coarse severity used for ranking and UI emphasis. */
	severity: IssueSeverity;

	/**
	 * Short bullets explaining what was detected.
	 *
	 * Guidelines:
	 * - Keep each entry concise and concrete.
	 * - Prefer “what” over “why”; deeper guidance belongs in recommendations/wizards.
	 */
	evidence: string[];

	/**
	 * Candidate fixes suggested by detectors (may be empty).
	 *
	 * Notes:
	 * - FixCandidates should be constructed with unique instance ids (FixCandidateId),
	 *   even when reusing the same recipeId (FixId).
	 */
	fixes: FixCandidate[];
}
