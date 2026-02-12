/**
 * tests/contract/ui/feed/render-feed/feed-provenance.contract.dom.test.ts
 *
 * This contract test protects the UI-level provenance link affordance exposed by
 * renderFeed. We treat the link label and its diagnostic attributes as stable,
 * so UI refactors do not silently break inspection and edit workflows.
 *
 * Contract:
 * - Provenance links render by default (showProvenanceLinks is undefined).
 * - Provenance links render when explicitly enabled (showProvenanceLinks is true).
 * - Provenance links do not render when disabled (showProvenanceLinks is false).
 *
 * Notes:
 * - We validate DOM output only. Obsidian navigation (open / jump-to-line) is an
 *   integration concern and is intentionally out of scope for this DOM contract.
 */

import { describe, expect, it } from "vitest";

import { asRecommendationId, asTaskId } from "@/core/model/id";
import type { RecommendationFeed } from "@/core/model/recommendation";
import { renderFeed } from "@/ui/feed/render-feed";

function makeFeed(kind: "collected" | "do-now"): RecommendationFeed {
	return {
		sections: [
			{
				title: kind === "collected" ? "Collected" : "Do now",
				items: [
					{
						kind,
						id: asRecommendationId(`rec:${kind}:test`),
						title: kind === "collected" ? "Collected sample" : "Execute now",
						why: ["baseline test"],
						score: { urgency: 0, friction: 0, payoff: 0 },
						tasks: [
							{
								id: asTaskId("task:a"),
								text: "task a",
								origin: { path: "folder/note.md", line: 12 },
							},
						],
					} as unknown as RecommendationFeed["sections"][number]["items"][number],
				],
			},
		],
	};
}

describe("ui/feed renderFeed", () => {
	it("shows provenance links when showProvenanceLinks is undefined", () => {
		const root = renderFeed(makeFeed("collected"), { doc: document });

		const link = root.querySelector(".taskx-rec__task-link") as HTMLAnchorElement | null;
		expect(link).not.toBeNull();

		// Contracted label: we render the alias directly (no Markdown parsing step here).
		expect(link?.textContent).toBe("note");

		// Best-effort Obsidian internal-link semantics.
		expect(link?.dataset.href).toBe("folder/note");

		// Copyable wiki-link diagnostics (not user-facing).
		expect(link?.dataset.taskxWiki).toBe("[[folder/note|note]]");
	});

	it("shows provenance links when showProvenanceLinks is true", () => {
		const root = renderFeed(makeFeed("collected"), { doc: document, showProvenanceLinks: true });

		const link = root.querySelector(".taskx-rec__task-link") as HTMLAnchorElement | null;
		expect(link).not.toBeNull();

		expect(link?.textContent).toBe("note");
		expect(link?.dataset.href).toBe("folder/note");
		expect(link?.dataset.taskxWiki).toBe("[[folder/note|note]]");
	});

	it("hides provenance links when showProvenanceLinks is false", () => {
		const root = renderFeed(makeFeed("collected"), { doc: document, showProvenanceLinks: false });

		const link = root.querySelector(".taskx-rec__task-link");
		expect(link).toBeNull();
	});

	it("renders provenance links for do-now task summaries", () => {
		const root = renderFeed(makeFeed("do-now"), { doc: document });

		const link = root.querySelector(".taskx-rec__task-link") as HTMLAnchorElement | null;
		expect(link).not.toBeNull();

		expect(link?.textContent).toBe("note");
		expect(link?.dataset.href).toBe("folder/note");
		expect(link?.dataset.taskxWiki).toBe("[[folder/note|note]]");
	});
});
