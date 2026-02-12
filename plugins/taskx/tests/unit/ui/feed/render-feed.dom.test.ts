/**
 * tests/unit/ui/feed/render-feed.dom.test.ts
 *
 * This is a **unit test** for the UI feed renderer.
 *
 * Intent:
 * - Assert stable class names and data attributes used for styling and wiring.
 * - Validate that the renderer stays "dumb" and follows the feed structure.
 *
 * Boundaries:
 * - We test the renderer in isolation by calling `renderFeed` directly.
 * - We do not test pipeline grouping, ranking, or cross-layer contracts here.
 * - We avoid snapshot tests and prefer explicit structural assertions.
 */

import { describe, expect, it } from "vitest";

import { asRecommendationId, asTaskId } from "@/core/model/id";
import type { RecommendationFeed } from "@/core/model/recommendation";
import { renderFeed } from "@/ui/feed/render-feed";

describe("ui/feed renderFeed", () => {
	it("renders an empty feed placeholder", () => {
		const feed: RecommendationFeed = {
			sections: [],
		};

		const root = renderFeed(feed, { doc: document });

		expect(root).toBeInstanceOf(HTMLElement);
		expect(root.classList.contains("taskx-feed")).toBe(true);

		const empty = root.querySelector(".taskx-feed__empty");
		expect(empty).not.toBeNull();
		expect(empty?.textContent).toBe("No recommendations.");
	});

	it("renders a do-now recommendation with stable hooks", () => {
		const feed: RecommendationFeed = {
			sections: [
				{
					title: "Do now",
					items: [
						{
							kind: "do-now",
							id: asRecommendationId("rec:do-now:test"),
							title: "Execute now",
							why: ["baseline test"],
							score: { urgency: 1, friction: 2, payoff: 3 },
							tasks: [
								{ id: asTaskId("task:a"), text: "task a" },
								{ id: asTaskId("task:b"), text: "task b" },
							],
						},
					],
				},
			],
		};

		// Unit test: keep output minimal and focus on stable hooks.
		const root = renderFeed(feed, { doc: document, showProvenanceLinks: false });

		expect(root.classList.contains("taskx-feed")).toBe(true);

		const sectionTitle = root.querySelector(".taskx-feed__section-title");
		expect(sectionTitle?.textContent).toBe("Do now");

		const item = root.querySelector("li.taskx-rec");
		expect(item).not.toBeNull();

		const li = item as HTMLLIElement;
		expect(li.dataset.taskxKind).toBe("do-now");
		expect(li.dataset.taskxId).toBe("rec:do-now:test");

		const summary = li.querySelector(".taskx-rec__summary");
		expect(summary?.textContent).toBe("2 tasks to do now");

		const taskTexts = Array.from(li.querySelectorAll(".taskx-rec__task-text")).map(
			n => n.textContent,
		);
		expect(taskTexts).toEqual(["task a", "task b"]);
	});
});
