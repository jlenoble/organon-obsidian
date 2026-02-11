/**
 * core/model/recommendation.ts
 *
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
 * Fields common to all recommendation variants.
 *
 * Notes:
 * - `id` is a stable identifier for the rendered item in the current feed.
 * - `why` holds short, concrete rationale strings for UI and debugging.
 * - `score` is consumed by ranking policy but can be shown in diagnostics.
 */
export interface RecommendationBase {
	id: RecommendationId;

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
}

/**
 * Variant payloads keyed by kind.
 *
 * This is the single source of truth for:
 * - the set of kinds,
 * - and the required fields for each kind.
 *
 * We derive the union type mechanically from this map to keep it consistent.
 */
export type RecommendationVariants = {
	fix: {
		fixes: FixCandidate[];
	};
	"do-now": {
		tasks: TaskId[];
	};
};

/**
 * Build the discriminated union from the variant map.
 *
 * “TS magic” rationale:
 * - Adding a new kind is a single edit in RecommendationVariants.
 * - The union automatically updates, keeping kind and payload aligned.
 */
export type Recommendation = {
	[K in keyof RecommendationVariants]: RecommendationBase & {
		kind: K;
	} & RecommendationVariants[K];
}[keyof RecommendationVariants];

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
