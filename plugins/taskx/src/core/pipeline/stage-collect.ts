/**
 * core/pipeline/stage-collect.ts
 *
 * This file defines the collection stage of the pipeline.
 *
 * Responsibility:
 * - Provide the TaskEntity[] universe for the rest of the pipeline.
 *
 * Design goals:
 * - Isolate all data-source concerns (Obsidian, Tasks plugin, Dataview, raw markdown)
 *   behind this seam.
 * - Keep the rest of the pipeline pure and source-agnostic.
 * - Make it easy to swap collection strategies without refactoring downstream stages.
 *
 * For the initial milestone:
 * - We return an empty array (or a stub).
 * - This allows us to build and test the full pipeline and UI wiring first.
 * - A real adapter will be plugged in next, without changing this file’s contract.
 */

import type { TaskEntity } from "../model/task";

/**
 * Collect tasks from the outside world and normalize them into TaskEntity objects.
 *
 * Notes:
 * - This function is intentionally synchronous for now to keep the pipeline simple.
 * - If we later need asynchronous collection, we can introduce an async pipeline
 *   variant or prefetch/cache at the adapter layer.
 */
export function stageCollect(): TaskEntity[] {
	// Stub implementation for the initial milestone.
	// Real collection will be implemented in adapters/obsidian and wired here.
	return [];
}
