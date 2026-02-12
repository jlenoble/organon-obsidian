/**
 * tests/contract/entry/render.contract.dom.test.ts
 *
 * This contract test protects an M1.0/M1.1-level invariant of the public entry API:
 * when tasks are collected, the rendered output must include a "Collected" section
 * that is human-inspectable and stable.
 *
 * Contract:
 * - We exercise the system via the public entrypoint `renderTaskX`.
 * - We inject a fixed TimeContext and a fixture collector.
 * - We assert only public, UI-consumable structure and stable DOM output.
 *
 * Scope:
 * - "Collected" appears when tasks exist.
 * - The collected list is capped (5 items) for a deterministic sample.
 * - Diagnostics (ids) are not shown unless explicitly enabled.
 */

import { describe, expect, it } from "vitest";

import { asTaskId } from "@/core/model/id";
import type { TaskEntity } from "@/core/model/task";
import { renderTaskX } from "@/entry/render";

function makeTask(i: number): TaskEntity {
	return {
		id: asTaskId(`task:${i}`),
		origin: { kind: "vault-markdown", path: `note-${i}.md`, line: i },
		text: `Task ${i}`,
		status: "todo",
		tags: new Set(),
		// We keep duration undefined here so the minimal do-now policy remains empty.
		duration: undefined,
		dates: {},
		raw: { markdown: `- [ ] Task ${i}` },
	};
}

describe("entry/render renderTaskX Collected contract", () => {
	it('renders a "Collected" section with a stable 5-item sample', async () => {
		const tasks = [1, 2, 3, 4, 5, 6, 7, 8].map(makeTask);

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

		// With collected tasks and no issues, we expect exactly two sections:
		// "Collected" then "Do now".
		expect(sectionTitles).toEqual(["Collected", "Do now"]);

		const collectedSection = root.querySelector(".taskx-feed__section");
		expect(collectedSection).toBeTruthy();

		const collectedTaskTexts = Array.from(
			root.querySelectorAll(".taskx-rec__collected .taskx-rec__task-text"),
		).map(n => n.textContent ?? "");

		// The collected sample is capped at 5 for stability.
		expect(collectedTaskTexts).toHaveLength(5);
		expect(collectedTaskTexts).toEqual(["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"]);

		// Id diagnostics must not appear unless explicitly enabled.
		expect(root.querySelectorAll(".taskx-rec__task-id")).toHaveLength(0);
	});
});
