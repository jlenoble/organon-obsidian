/**
 * tests/contract/core/pipeline/pipeline.contract.test.ts
 *
 * This contract test protects an M0-level invariant of the public pipeline API:
 * running the pipeline must always return a renderable RecommendationFeed,
 * even when no tasks are collected and no features are registered.
 *
 * Although we are now in M1/T1 development, this test continues to lock in
 * the baseline behavior established in M0. Changes in collection strategy
 * (e.g. async adapters) must not break this contract.
 *
 * Contract:
 * - We call runPipeline only via its public orchestrator API.
 * - We do not reach into stage internals or registries directly.
 * - We assert only UI-consumable RecommendationFeed structure.
 *
 * Scope:
 * - Empty-universe baseline: no tasks collected and no detectors registered.
 * - Ensures the feed remains deterministic and renderable in the minimal case.
 */

import { describe, expect, it } from "vitest";

import type { Recommendation } from "@/core/model/recommendation";
import type { TimeContext } from "@/core/model/time";
import { runPipeline } from "@/core/pipeline/pipeline";

function assertDoNow(rec: Recommendation): Extract<Recommendation, { kind: "do-now" }> {
	// We deliberately use a real runtime guard because `expect(...)` does not
	// contribute to TypeScript's narrowing.
	if (rec.kind !== "do-now") {
		throw new Error(`expected kind="do-now", got kind="${rec.kind}"`);
	}
	return rec;
}

describe("core/pipeline runPipeline feed contract", () => {
	it("returns a renderable feed for the empty task universe", async () => {
		const ctx: TimeContext = {
			now: new Date("2026-02-11T00:00:00.000Z"),
			tz: "Europe/Paris",
		};

		const feed = await runPipeline({
			ctx,
			collect: async () => [],
		});

		// M0 invariant: the pipeline returns a UI-ready feed object even for an empty input.
		expect(feed).toBeTruthy();
		expect(Array.isArray(feed.sections)).toBe(true);

		// With no registered detectors and no tasks, we still emit the shallow do-now rec.
		expect(feed.sections).toHaveLength(1);

		const [section] = feed.sections;
		expect(section.title).toBe("Do now");
		expect(section.items).toHaveLength(1);

		const [rec] = section.items;

		expect(rec.kind).toBe("do-now");
		expect(rec.id).toBe("rec:do-now:shallow");

		const doNow = assertDoNow(rec);

		// We keep the do-now payload well-defined even when it is empty.
		expect(doNow.tasks).toEqual([]);

		// Minimal scoring invariants (used by ranking policy and diagnostics).
		expect(doNow.score).toEqual({ urgency: 40, friction: 5, payoff: 35 });
	});
});
