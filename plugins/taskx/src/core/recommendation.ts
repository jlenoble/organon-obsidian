/**
 * This file defines the UI-facing contract of the TaskX core:
 * the Recommendation and RecommendationFeed structures.
 *
 * Conceptually:
 * - Issues report problems.
 * - FixCandidates and wizards describe how to resolve them.
 * - Recommendations describe “what to do now”, in a form directly consumable by the UI.
 *
 * The UI must not depend on TaskEntity, Issue, or Fix internals.
 * It should only consume RecommendationFeed.
 */

import type { FixCandidate } from "./fix";
import type { RecommendationId, TaskId } from "./id";

/**
 * Closed set of recommendation kinds.
 *
 * Rationale:
 * - The renderer needs to know which layout/interaction model to use.
 * - We keep this intentionally small and semantic.
 *
 * Current kinds:
 * - "fix": apply or review a proposed fix
 * - "do-now": execute one or more tasks now
 *
 * Later additions may include:
 * - "wizard": interactive resolution (e.g., decomposition, planning)
 * - "plan": shape a day or time window
 */
export type RecommendationKind = "fix" | "do-now";

/**
 * Scoring signals attached to a recommendation.
 *
 * These are not absolute truths; they are policy inputs used by ranking/grouping.
 *
 * Conventions:
 * - All values are integers in the range 0..100.
 * - Higher urgency means “sooner”.
 * - Higher friction means “harder / more costly mentally”.
 * - Higher payoff means “more benefit / more unlocking effect”.
 */
export interface RecommendationScore {
	urgency: number;
	friction: number;
	payoff: number;
}

/**
 * A Recommendation is one actionable suggestion shown to the user.
 *
 * Key ideas:
 * - It has a stable id for UI diffing and action routing.
 * - It has a kind that determines rendering and interaction style.
 * - It has a human-readable title and short justification bullets.
 * - It carries either fixes or tasks (or later, wizard references).
 */
export interface Recommendation {
	/** Unique identifier for this recommendation item. */
	id: RecommendationId;

	/** Semantic kind used by the renderer to choose layout/controls. */
	kind: RecommendationKind;

	/** Short, user-facing title. */
	title: string;

	/**
	 * Short bullets explaining why this recommendation is shown.
	 *
	 * Guidelines:
	 * - Keep it concise.
	 * - Prefer concrete signals over abstract theory.
	 */
	why: string[];

	/** Scoring signals for ranking and grouping policies. */
	score: RecommendationScore;

	/**
	 * Fix candidates associated with this recommendation (for kind === "fix").
	 *
	 * Notes:
	 * - We keep this optional to allow other kinds without overloading the type.
	 * - The renderer decides how to present these (buttons, links, etc.).
	 */
	fixes?: FixCandidate[];

	/**
	 * Task targets associated with this recommendation (for kind === "do-now", etc.).
	 *
	 * Notes:
	 * - These are TaskIds, not full TaskEntity objects, to keep the UI contract light.
	 * - The renderer may choose to resolve/display task titles via a separate lookup.
	 */
	tasks?: TaskId[];
}

/**
 * A RecommendationFeed is the structured output of the pipeline for the UI.
 *
 * Characteristics:
 * - Grouped into semantic sections (e.g., "Unblock", "Do now").
 * - Ordering within and between sections is already decided by the pipeline.
 * - The UI should render this structure as-is, without re-ranking.
 */
export interface RecommendationFeed {
	sections: Array<{
		/** Section title, e.g. "Unblock", "Do now", "Plan". */
		title: string;

		/** Ordered list of recommendations in this section. */
		items: Recommendation[];
	}>;
}
