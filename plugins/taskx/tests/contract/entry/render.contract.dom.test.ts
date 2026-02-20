/**
 * tests/contract/entry/render.contract.dom.test.ts
 *
 * This contract test protects M1-level invariants of the public entry API:
 * when tasks are collected, entry-level visibility defaults are applied deterministically
 * and the rendered output remains stable and inspectable.
 *
 * Contract:
 * - We exercise the system via the public entrypoint `renderTaskX`.
 * - We inject a fixed TimeContext and a fixture collector.
 * - We assert only public, UI-consumable structure and stable DOM output.
 *
 * Scope:
 * - With default `collectedVisibility: "auto"`, Collected is hidden when actionable
 *   sections are present.
 * - "Do now" is prioritized by ranking policy.
 * - Diagnostics (ids) are not shown unless explicitly enabled.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { asTaskId } from "@/core/model/id";
import type { TaskEntity } from "@/core/model/task";
import { renderTaskX } from "@/entry/render";

const { writeDebugFeedMirrorMock } = vi.hoisted(() => ({
	writeDebugFeedMirrorMock: vi.fn(),
}));

vi.mock("@/adapters/obsidian/debug-feed-mirror", () => ({
	writeDebugFeedMirror: writeDebugFeedMirrorMock,
}));

function makeTask(i: number, opts: { duration?: number; tags?: string[] } = {}): TaskEntity {
	return {
		id: asTaskId(`task:${i}`),
		origin: { kind: "vault-markdown", path: `note-${i}.md`, line: i },
		text: `Task ${i}`,
		status: "todo",
		tags: new Set(opts.tags ?? []),
		duration: opts.duration,
		dates: {},
		raw: { markdown: `- [ ] Task ${i}` },
	};
}

describe("entry/render renderTaskX Collected contract", () => {
	beforeEach(() => {
		writeDebugFeedMirrorMock.mockReset();
		writeDebugFeedMirrorMock.mockResolvedValue({ ok: true });
	});

	it('hides "Collected" by default when actionable sections are present', async () => {
		const tasks = [1, 2, 3, 4, 5, 6, 7, 8].map(i => makeTask(i));

		const root = await renderTaskX({
			// We never use the app when collect/buildCtx are injected, but the entry
			// contract requires an App-shaped value.
			app: {} as never,

			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),

			collect: async () => tasks,

			// Diagnostics are off by default; we keep it explicit here.
			showIds: false,
		});

		expect(root).toBeTruthy();

		const sectionTitles = Array.from(root.querySelectorAll(".taskx-feed__section-title")).map(
			n => n.textContent ?? "",
		);

		// Default `auto` mode hides Collected when actionable sections are present.
		expect(sectionTitles).toEqual(["Do now"]);
		expect(root.querySelectorAll(".taskx-rec__collected")).toHaveLength(0);

		// Id diagnostics must not appear unless explicitly enabled.
		expect(root.querySelectorAll(".taskx-rec__task-id")).toHaveLength(0);
	});

	it('shows "Collected" when collectedVisibility is "always"', async () => {
		const tasks = [1, 2, 3, 4, 5, 6, 7, 8].map(i => makeTask(i));

		const root = await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			collectedVisibility: "always",
		});

		const sectionTitles = Array.from(root.querySelectorAll(".taskx-feed__section-title")).map(
			n => n.textContent ?? "",
		);

		expect(sectionTitles).toEqual(["Do now", "Collected"]);

		const collectedTaskTexts = Array.from(
			root.querySelectorAll(".taskx-rec__collected .taskx-rec__task-text"),
		).map(n => n.textContent ?? "");
		expect(collectedTaskTexts).toHaveLength(5);
	});

	it('hides "Collected" when collectedVisibility is "never"', async () => {
		const tasks = [1, 2, 3, 4, 5, 6, 7, 8].map(i => makeTask(i));

		const root = await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			collectedVisibility: "never",
		});

		const sectionTitles = Array.from(root.querySelectorAll(".taskx-feed__section-title")).map(
			n => n.textContent ?? "",
		);

		expect(sectionTitles).toEqual(["Do now"]);
		expect(root.querySelectorAll(".taskx-rec__collected")).toHaveLength(0);
	});

	it("caps do-now tasks to 5 by default", async () => {
		const tasks = [1, 2, 3, 4, 5, 6, 7, 8].map(i => makeTask(i, { duration: 15 }));

		const root = await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			showIds: false,
		});

		const doNowTaskTexts = Array.from(
			root.querySelectorAll(".taskx-rec__do-now .taskx-rec__task-text"),
		).map(n => n.textContent ?? "");

		expect(doNowTaskTexts).toHaveLength(5);
		expect(doNowTaskTexts).toEqual(["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"]);
	});

	it("does not mirror output when debug feed mirror is disabled", async () => {
		const tasks = [1, 2, 3].map(i => makeTask(i, { duration: 15 }));

		await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			enableDebugFeedMirror: false,
		});

		expect(writeDebugFeedMirrorMock).not.toHaveBeenCalled();
	});

	it("mirrors rendered output when debug feed mirror is enabled", async () => {
		const tasks = [1, 2, 3].map(i => makeTask(i, { duration: 15 }));

		await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			enableDebugFeedMirror: true,
			debugFeedMirrorPath: "plugins/taskx/temp/task_feed.html",
		});

		expect(writeDebugFeedMirrorMock).toHaveBeenCalledTimes(1);
		expect(writeDebugFeedMirrorMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: "plugins/taskx/temp/task_feed.html",
			}),
		);

		const firstCallParams = writeDebugFeedMirrorMock.mock.calls[0][0] as {
			content: string;
		};
		expect(firstCallParams.content).toContain("Do now");
		expect(firstCallParams.content).toContain("Task 1");
	});

	it("keeps rendering when mirror write reports failure", async () => {
		const tasks = [1, 2, 3].map(i => makeTask(i, { duration: 15 }));
		writeDebugFeedMirrorMock.mockResolvedValueOnce({
			ok: false,
			error: new Error("write failed"),
		});

		const root = await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			enableDebugFeedMirror: true,
		});

		expect(root.querySelectorAll(".taskx-feed__section-title")).toHaveLength(1);
		expect(writeDebugFeedMirrorMock).toHaveBeenCalledTimes(1);
	});

	it("shows no debug subset indicator when debug subset mode is disabled", async () => {
		const tasks = [1, 2, 3].map(i => makeTask(i, { duration: 15 }));

		const root = await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			enableDebugSubsetMode: false,
		});

		expect(root.querySelector(".taskx-feed__debug-indicator")).toBeNull();
	});

	it("shows debug subset indicator and keeps only tagged tasks when matches exist", async () => {
		const tasks = [
			makeTask(1, { duration: 15, tags: ["taskx-debug"] }),
			makeTask(2, { duration: 15 }),
			makeTask(3, { duration: 15, tags: ["#taskx-debug"] }),
		];

		const root = await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			enableDebugSubsetMode: true,
			debugSubsetTag: "taskx-debug",
		});

		const indicator = root.querySelector(".taskx-feed__debug-indicator");
		expect(indicator?.textContent).toContain("Debug subset mode active");
		expect(indicator?.textContent).toContain("#taskx-debug");

		const doNowTaskTexts = Array.from(
			root.querySelectorAll(".taskx-rec__do-now .taskx-rec__task-text"),
		).map(n => n.textContent ?? "");

		expect(doNowTaskTexts).toEqual(["Task 1", "Task 3"]);
	});

	it("keeps debug indicator and falls back to baseline output when no tags match", async () => {
		const tasks = [1, 2, 3].map(i => makeTask(i, { duration: 15 }));

		const root = await renderTaskX({
			app: {} as never,
			buildCtx: () => ({
				now: new Date("2026-02-12T00:00:00.000Z"),
				tz: "Europe/Paris",
			}),
			collect: async () => tasks,
			enableDebugSubsetMode: true,
			debugSubsetTag: "taskx-debug",
		});

		const indicator = root.querySelector(".taskx-feed__debug-indicator");
		expect(indicator?.textContent).toContain("Debug subset mode active");

		const doNowTaskTexts = Array.from(
			root.querySelectorAll(".taskx-rec__do-now .taskx-rec__task-text"),
		).map(n => n.textContent ?? "");

		expect(doNowTaskTexts).toEqual(["Task 1", "Task 2", "Task 3"]);
	});
});
