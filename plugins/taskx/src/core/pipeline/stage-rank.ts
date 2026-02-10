/**
 * src/core/pipeline/stage-rank.ts
 *
 * What this file is:
 * - A pure pipeline stage that converts a flat list of Recommendation items into a structured
 *   RecommendationFeed suitable for direct rendering.
 *
 * Why this exists:
 * - The UI must not re-rank, re-group, or reinterpret recommendations.
 * - Grouping and ordering policy must live in the core pipeline to keep behavior deterministic
 *   and to preserve a stable UI contract over time.
 *
 * Responsibilities:
 * - Group recommendations into a small set of semantic sections.
 * - Order sections deterministically.
 * - Order items within each section deterministically.
 *
 * Non-goals:
 * - No advanced scoring policy (weighting, learning, personalization).
 * - No planning heuristics (superblocks, day shaping).
 * - No feature-specific grouping rules (those should be expressed via recommendation kinds
 *   or later dedicated metadata, not UI heuristics).
 *
 * Design notes:
 * - Our current contract is intentionally coarse: we group by Recommendation.kind.
 * - When we later introduce more kinds (wizard, plan), we will extend grouping here rather
 *   than pushing policy into the renderer.
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

	// M0 policy: "fix" first (unblock), then "do-now" (execute).
	addSection(sections, "Unblock", byKind.get("fix") ?? []);
	addSection(sections, "Do now", byKind.get("do-now") ?? []);

	// Any unexpected kinds (future additions) are preserved deterministically at the end.
	for (const [kind, items] of byKind.entries()) {
		if (kind === "fix" || kind === "do-now") {
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
 * - We sort kinds lexicographically before emitting sections beyond the known M0 kinds,
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
 * - We do not emit empty sections in M0 to keep the renderer simple.
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
 * - This is intentionally simple and policy-light for M0.
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
 * - Known M0 kinds are handled explicitly by the stage and should not use this path.
 */
function kindToTitle(kind: RecommendationKind): string {
	return String(kind)
		.split("-")
		.map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
		.join(" ");
}
