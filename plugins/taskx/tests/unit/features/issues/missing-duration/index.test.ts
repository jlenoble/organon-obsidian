/**
 * tests/unit/features/issues/missing-duration/index.test.ts
 *
 * This file defines unit tests for the missing-duration feature detector.
 *
 * Intent:
 * - Verify detector behavior for todo tasks without duration.
 * - Verify non-matching tasks are ignored.
 *
 * Notes:
 * - We mock registry registration to avoid cross-test side effects.
 * - We test only detector output, not pipeline integration.
 */

import { describe, expect, it, vi } from "vitest";

import { buildFactsIndex } from "@/core/model/facts";
import { asTaskId } from "@/core/model/id";
import type { TaskEntity } from "@/core/model/task";
import type { TimeContext } from "@/core/model/time";

// The feature module registers itself on import; we mock the registry module
// so this unit test stays isolated and does not mutate global detector state.
vi.mock("@/core/registries/issue-detectors", () => ({
	registerIssueDetector: vi.fn(),
	listIssueDetectors: vi.fn(() => []),
}));

function makeTask(args: { id: string; status?: "todo" | "done"; duration?: number }): TaskEntity {
	return {
		id: asTaskId(args.id),
		origin: { kind: "vault-markdown", path: "inbox.md", line: 1 },
		text: `Task ${args.id}`,
		status: args.status ?? "todo",
		tags: new Set<string>(),
		duration: args.duration,
		dates: {},
		raw: { markdown: `- [ ] Task ${args.id}` },
	};
}

const ctx: TimeContext = {
	now: new Date("2026-02-13T00:00:00.000Z"),
	tz: "Europe/Paris",
};

describe("features/issues/missing-duration detector", () => {
	it("emits a blocker issue with a default set-duration fix for todo tasks without duration", async () => {
		const tasks = [makeTask({ id: "task:1" })];
		const facts = buildFactsIndex(tasks);

		const { missingDurationIssueDetector } = await import(
			"@/features/issues/missing-duration/index"
		);

		const issues = missingDurationIssueDetector.detect({ tasks, facts, ctx });

		expect(issues).toHaveLength(1);
		expect(issues[0].id).toBe("missing-duration:task:1");
		expect(issues[0].target).toBe("task:1");
		expect(issues[0].severity).toBe("blocker");
		expect(issues[0].fixes).toHaveLength(1);

		const [fix] = issues[0].fixes;
		expect(fix.recipeId).toBe("fix:set-duration-15m");
		expect(fix.label).toBe("Set duration to 15 minutes");
		expect(fix.actions).toEqual([{ type: "set-duration", minutes: 15 }]);
	});

	it("ignores tasks that are done or already have a duration", async () => {
		const tasks = [
			makeTask({ id: "task:done", status: "done" }),
			makeTask({ id: "task:dur", duration: 25 }),
		];
		const facts = buildFactsIndex(tasks);

		const { missingDurationIssueDetector } = await import(
			"@/features/issues/missing-duration/index"
		);

		const issues = missingDurationIssueDetector.detect({ tasks, facts, ctx });
		expect(issues).toEqual([]);
	});
});
