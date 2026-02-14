/**
 * tests/contract/entry/render.contract.dom.test.ts
 *
 * This contract test protects an M1.0/M1.1-level invariant of the public entry API:
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

import { describe, expect, it } from "vitest";

import { asTaskId } from "@/core/model/id";
import type { TaskEntity } from "@/core/model/task";
import { renderTaskX } from "@/entry/render";

function makeTask(i: number, opts: { duration?: number } = {}): TaskEntity {
	return {
		id: asTaskId(`task:${i}`),
		origin: { kind: "vault-markdown", path: `note-${i}.md`, line: i },
		text: `Task ${i}`,
		status: "todo",
		tags: new Set(),
		duration: opts.duration,
		dates: {},
		raw: { markdown: `- [ ] Task ${i}` },
	};
}

describe("entry/render renderTaskX Collected contract", () => {
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
});
