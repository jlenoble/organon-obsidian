/**
 * adapters/obsidian/collect-tasks.ts
 *
 * This adapter collects tasks from the vault using Dataview and normalizes them
 * into the core TaskEntity shape. It provides a minimal, mechanical bridge from
 * the Obsidian environment to the tool-agnostic pipeline.
 *
 * The intent is to make real tasks flow end-to-end without introducing policy.
 * We keep collection conservative: preserve order, avoid filtering, and attach
 * only the data needed to make TaskEntity well-formed.
 *
 * Scope:
 * - Read tasks via Dataview.
 * - Build TaskEntity values with id, origin, status, and raw text.
 * - Leave interpretation, filtering, and ranking to later pipeline stages.
 *
 * Non-goals:
 * - No policy decisions (what is actionable, important, etc.).
 * - No scoring, no issue detection, no patching.
 */

import type { App } from "obsidian";

import { makeTaskId, type TaskIdOrigin } from "./make-task-id";
import type { TaskEntity } from "../../core/model/task";

/**
 * Collect tasks from the vault using Dataview.
 *
 * Notes:
 * - We keep the Dataview API typed as `unknown` here to avoid leaking Dataview
 *   types outside the adapter boundary.
 * - Tasks are returned in the order provided by Dataview.
 * - We populate only minimal fields required by TaskEntity.
 */
export async function collectTasksFromDataview(args: {
	app: App;
	dataviewApi: unknown;
}): Promise<TaskEntity[]> {
	const { dataviewApi } = args;

	// Minimal structural typing for the Dataview data we consume.
	const dv = dataviewApi as {
		pages: (query: string) => Array<{
			file: {
				path: string;
				tasks: Array<{
					text: string;
					completed: boolean;
					line: number;
				}>;
			};
		}>;
	};

	const pages = dv.pages("");

	const out: TaskEntity[] = [];

	for (const page of pages) {
		const filePath = page.file.path;

		// Fallback index is scoped to a file to keep ids stable within that file.
		let indexInFile = 0;

		for (const t of page.file.tasks) {
			const origin: TaskIdOrigin & { kind: string } = {
				kind: "vault-markdown",
				path: filePath,
				// Dataview reports a 1-based line number.
				line: t.line,
			};

			// Dataview does not provide the exact raw markdown line.
			// We retain the best available text as a placeholder for now.
			const rawMarkdown = t.text;

			const id = makeTaskId({
				origin,
				rawMarkdown,
				fallbackIndex: indexInFile,
			});

			const entity: TaskEntity = {
				id,
				origin,
				text: t.text,
				status: t.completed ? "done" : "todo",
				tags: new Set<string>(),
				dates: {},
				raw: {
					markdown: rawMarkdown,
				},
			};

			out.push(entity);
			indexInFile++;
		}
	}

	return out;
}
