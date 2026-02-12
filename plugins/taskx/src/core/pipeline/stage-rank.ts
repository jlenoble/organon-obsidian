/**
 * core/pipeline/stage-rank.ts
 *
 * This stage turns a flat list of recommendations into a structured feed.
 * It is where we decide how the UI will see the output: which sections exist,
 * which order they appear in, and which order items appear inside each section.
 *
 * This exists to keep the UI dumb. Rendering should not change meaning.
 * If grouping or ordering is a decision, it belongs in the pipeline.
 *
 * Intent:
 * - Produce a RecommendationFeed that is ready to render.
 * - Keep the result deterministic for the same inputs.
 *
 * Limits:
 * - This is early policy. It stays simple and boring.
 *
 * Non-goals:
 * - Advanced scoring or personalization.
 * - Planning or scheduling logic.
 * - Feature-specific grouping rules beyond the recommendation kind.
 */

import type {
	Recommendation,
	RecommendationFeed,
	RecommendationKind,
} from "../model/recommendation";

/**
 * Group and order recommendations into a feed structure for rendering.
 *
 * Notes:
 * - This function is pure and must not mutate its inputs.
 * - All grouping and ordering policy lives here, not in the UI.
 * - The UI must treat the returned structure as authoritative.
 */
export function stageRank(recs: Recommendation[]): RecommendationFeed {
	// We use a small, explicit mapping so grouping policy remains visible and stable.
	const byKind = groupByKind(recs);

	const sections: RecommendationFeed["sections"] = [];

	// Early policy: show "collected" first so real tasks are visible immediately.
	addSection(sections, "Collected", byKind.get("collected") ?? []);

	// Then unblock, then execute.
	addSection(sections, "Unblock", byKind.get("fix") ?? []);
	addSection(sections, "Do now", byKind.get("do-now") ?? []);

	// Any unexpected kinds (future additions) are preserved deterministically at the end.
	for (const [kind, items] of byKind.entries()) {
		if (kind === "collected" || kind === "fix" || kind === "do-now") {
			continue;
		}

		addSection(sections, kindToTitle(kind), items);
	}

	return { sections };
}

/**
 * Group recommendations by kind while preserving deterministic iteration order.
 *
 * Notes:
 * - We sort kinds lexicographically before emitting sections beyond the known kinds,
 *   so the output is stable regardless of registration order in earlier stages.
 */
function groupByKind(recs: Recommendation[]): Map<RecommendationKind, Recommendation[]> {
	const tmp = new Map<RecommendationKind, Recommendation[]>();

	for (const rec of recs) {
		const bucket = tmp.get(rec.kind);
		if (bucket) {
			bucket.push(rec);
		} else {
			tmp.set(rec.kind, [rec]);
		}
	}

	// Ensure deterministic iteration order for kinds beyond our known primary kinds.
	const entries = Array.from(tmp.entries()).sort((a, b) =>
		String(a[0]).localeCompare(String(b[0])),
	);

	return new Map(entries);
}

/**
 * Add a section to the feed if it contains any items.
 *
 * Notes:
 * - We do not emit empty sections to keep the renderer simple.
 */
function addSection(
	sections: RecommendationFeed["sections"],
	title: string,
	items: Recommendation[],
): void {
	if (items.length === 0) {
		return;
	}

	sections.push({
		title,
		items: sortWithinSection(items),
	});
}

/**
 * Sort items within a section deterministically.
 *
 * Current policy:
 * - Higher urgency first,
 * - Then higher payoff,
 * - Then lower friction,
 * - Then stable id ordering as a final tie-breaker.
 *
 * Notes:
 * - This is intentionally simple and policy-light.
 * - We use only Recommendation.score and Recommendation.id, keeping this stage decoupled
 *   from tasks/issues internals.
 */
function sortWithinSection(items: Recommendation[]): Recommendation[] {
	return [...items].sort((a, b) => {
		const du = b.score.urgency - a.score.urgency;
		if (du !== 0) {
			return du;
		}

		const dp = b.score.payoff - a.score.payoff;
		if (dp !== 0) {
			return dp;
		}

		const df = a.score.friction - b.score.friction;
		if (df !== 0) {
			return df;
		}

		return String(a.id).localeCompare(String(b.id));
	});
}

/**
 * Convert a recommendation kind into a user-facing section title.
 *
 * Notes:
 * - This is a fallback for future kinds.
 * - Known kinds are handled explicitly by the stage and should not use this path.
 */
function kindToTitle(kind: RecommendationKind): string {
	return String(kind)
		.split("-")
		.map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
		.join(" ");
}
