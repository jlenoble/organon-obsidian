/**
 * plugin.ts
 *
 * This file is the Obsidian plugin entrypoint for TaskX.
 *
 * Responsibility:
 * - Register the TaskX code block processor.
 * - Delegate all computation to the entry renderer.
 * - Manage only lifecycle glue (mount, unmount, refresh).
 *
 * Invariants:
 * - We do not implement policy, ranking, or feature logic here.
 * - We do not reach into core or pipeline internals directly.
 *
 * Non-goals:
 * - Settings, commands, or UI chrome (those come later).
 * - Any mutation of notes or vault state.
 */

import { Plugin } from "obsidian";

// Feature registration side effects (keep explicit; add new feature imports here).
import "@/features/issues/missing-duration";
import { renderTaskX } from "./entry/render";

export default class TaskXPlugin extends Plugin {
	async onload(): Promise<void> {
		// Register a simple code block: ```taskx
		// The processor clears the container and mounts a fresh render each time.
		this.registerMarkdownCodeBlockProcessor("taskx", async (_src, el) => {
			el.empty();

			const view = await renderTaskX({ app: this.app });
			el.appendChild(view);
		});
	}

	onunload(): void {
		// Nothing to clean up yet. We rely on Obsidian to dispose of DOM nodes.
	}
}
