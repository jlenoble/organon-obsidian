/**
 * tests/contract/core/pipeline/pipeline-missing-duration.contract.test.ts
 *
 * This file defines a contract test for the first issue feature integration:
 * when a task is missing duration, the pipeline output must expose a visible
 * unblock/fix recommendation in the rendered feed contract.
 *
 * Intent:
 * - Validate end-to-end behavior through the public pipeline entrypoint.
 * - Protect the M1.3 expectation that missing-duration is user-visible.
 */

import { describe, expect, it } from "vitest";

import { asTaskId } from "@/core/model/id";
import type { TaskEntity } from "@/core/model/task";
import type { TimeContext } from "@/core/model/time";
import { runPipeline } from "@/core/pipeline/pipeline";
import "@/features/issues/missing-duration";

function makeTaskMissingDuration(id: string): TaskEntity {
	return {
		id: asTaskId(id),
		origin: { kind: "vault-markdown", path: "inbox.md", line: 1 },
		text: "Task without duration",
		status: "todo",
		tags: new Set<string>(),
		duration: undefined,
		dates: {},
		raw: { markdown: "- [ ] Task without duration" },
	};
}

describe("core/pipeline missing-duration contract", () => {
	it("emits a visible fix recommendation for tasks missing duration", async () => {
		const ctx: TimeContext = {
			now: new Date("2026-02-13T00:00:00.000Z"),
			tz: "Europe/Paris",
		};

		const feed = await runPipeline({
			ctx,
			collect: async () => [makeTaskMissingDuration("task:missing-duration")],
		});

		const sectionTitles = feed.sections.map(s => s.title);
		expect(sectionTitles).toContain("Unblock");

		const allItems = feed.sections.flatMap(s => s.items);
		const fixItems = allItems.filter(item => item.kind === "fix") as Array<
			Extract<(typeof allItems)[number], { kind: "fix" }>
		>;

		expect(fixItems.length).toBeGreaterThan(0);

		const withDurationFix = fixItems.some(item =>
			item.fixes.some(
				fix =>
					fix.recipeId === "fix:set-duration-15m" &&
					fix.actions.some(action => action.type === "set-duration" && action.minutes === 15),
			),
		);

		expect(withDurationFix).toBe(true);
	});
});
