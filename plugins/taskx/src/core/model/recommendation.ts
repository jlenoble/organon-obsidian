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
 * Invariants:
 * - The UI must not depend on TaskEntity, Issue, or Fix internals.
 * - The UI consumes RecommendationFeed as-is (no re-ranking, no regrouping).
 * - Recommendation is a discriminated union on `kind` to prevent impossible states.
 *
 * Non-goals:
 * - Rendering logic (ui/*).
 * - Ranking/grouping policy (core/pipeline/stage-rank.ts).
 */

import type { FixCandidate } from "./fix";
import type { RecommendationId, TaskId } from "./id";

/**
 * Minimal, UI-facing task summary.
 *
 * Rationale:
 * - The UI must not depend on TaskEntity (or any adapter-specific shape).
 * - The feed must remain human-inspectable without forcing the UI to do lookups.
 * - We keep provenance optional and lightweight so it can be rendered as
 *   diagnostics without becoming a policy surface.
 */
export interface TaskSummary {
	/** Stable task identifier, used for future click wiring and diagnostics. */
	id: TaskId;

	/** Human-readable task text (already normalized at collection time). */
	text: string;

	/** Optional provenance for diagnostics and future patch application. */
	origin?: {
		path: string;
		line?: number;
	};
}

/**
 * Closed set of recommendation kinds.
 *
 * Notes:
 * - This is a UI contract. Adding a new kind implies a new renderer behavior.
 * - We keep kinds semantic (what the user does), not implementation-driven.
 *
 * Current kinds:
 * - "collected": a policy-light sample of tasks collected from the vault
 * - "fix": apply or review a proposed fix
 * - "do-now": execute one or more tasks now
 *
 * Expected later additions (M2 examples):
 * - "wizard": interactive resolution (decomposition, planning)
 * - "plan": day shaping / time-window planning
 */
export type RecommendationKind = "collected" | "fix" | "do-now";

/**
 * Scoring signals attached to a recommendation.
 *
 * These are policy inputs used by ranking/grouping. They are not absolute truths.
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
	/** Stable identifier for this recommendation item in the feed. */
	id: RecommendationId;

	/** Short, user-facing title. */
	title: string;

	/**
	 * Short bullets explaining why this recommendation is shown.
	 *
	 * Guidelines:
	 * - Keep it concise.
	 * - Prefer concrete signals over abstract theory.
	 * - Avoid duplicating the title; explain the cause and context instead.
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
 * We derive the union type mechanically from this map so that:
 * - kind additions are centralized and reviewable,
 * - each kind has an explicit payload contract,
 * - impossible states are prevented (e.g., kind="fix" without `fixes`).
 */
export type RecommendationVariants = {
	collected: {
		tasks: TaskSummary[];
	};

	fix: {
		fixes: FixCandidate[];
	};

	"do-now": {
		tasks: TaskId[];
	};
};

/**
 * Discriminated union of all recommendation variants.
 *
 * “TS magic” rationale:
 * - Adding a new kind is a single edit in RecommendationVariants.
 * - The union automatically updates, keeping kind and payload aligned.
 *
 * Narrowing patterns:
 * - Extract<Recommendation, { kind: "fix" }> works as expected.
 * - `if (rec.kind === "fix") { ... }` narrows to the fix variant payload.
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
 * - Grouped into semantic sections (e.g., "Collected", "Unblock", "Do now").
 * - Ordering within and between sections is already decided by the pipeline.
 * - The UI should render this structure as-is, without re-ranking.
 */
export interface RecommendationFeed {
	sections: Array<{
		/** Section title, e.g. "Collected", "Unblock", "Do now", "Plan". */
		title: string;

		/** Ordered list of recommendations in this section. */
		items: Recommendation[];
	}>;
}
