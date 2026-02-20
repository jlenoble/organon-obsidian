/**
 * tests/unit/adapters/obsidian/collect-tasks.test.ts
 *
 * This unit test protects adapter-level normalization behavior for Dataview
 * task collection.
 *
 * Intent:
 * - Ensure TaskEntity.tags is populated from Dataview task tags.
 * - Ensure tag matching inputs are normalized consistently.
 */

import { describe, expect, it } from "vitest";

import { collectTasksFromDataview } from "@/adapters/obsidian/collect-tasks";

type DataviewPageFixture = {
	file: {
		path: string;
		tasks: Array<{
			text: string;
			completed: boolean;
			line: number;
			tags?: unknown;
		}>;
	};
};

describe("adapters/obsidian/collect-tasks tag extraction", () => {
	it("collects and normalizes tag tokens from Dataview task data", async () => {
		const dataviewApi = {
			pages: (): DataviewPageFixture[] => [
				{
					file: {
						path: "note-a.md",
						tasks: [
							{
								text: "Task with tags",
								completed: false,
								line: 10,
								tags: ["#TaskX-Debug", "  #focus  ", { tag: "#MiXeD" }, { tag: "  " }],
							},
						],
					},
				},
			],
		};

		const tasks = await collectTasksFromDataview({
			app: {} as never,
			dataviewApi,
		});

		expect(tasks).toHaveLength(1);
		expect(Array.from(tasks[0].tags)).toEqual(["taskx-debug", "focus", "mixed"]);
	});

	it("uses an empty tag set when Dataview task tags are absent", async () => {
		const dataviewApi = {
			pages: (): DataviewPageFixture[] => [
				{
					file: {
						path: "note-b.md",
						tasks: [{ text: "Task without tags", completed: false, line: 2 }],
					},
				},
			],
		};

		const tasks = await collectTasksFromDataview({
			app: {} as never,
			dataviewApi,
		});

		expect(tasks).toHaveLength(1);
		expect(tasks[0].tags.size).toBe(0);
	});
});
