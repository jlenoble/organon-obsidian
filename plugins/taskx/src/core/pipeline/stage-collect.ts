/**
 * core/pipeline/stage-collect.ts
 *
 * This file defines the collection stage of the pipeline.
 *
 * We keep collection behind this seam so the rest of the pipeline stays
 * tool-agnostic. The pipeline only consumes TaskEntity values; how tasks are
 * collected is an adapter concern decided at the entry boundary.
 *
 * Scope:
 * - Invoke a caller-provided collector and return its TaskEntity[] output.
 *
 * Non-goals:
 * - Implementing the collector here.
 * - Depending on Obsidian, Dataview, or Tasks plugin APIs.
 */

import type { TaskEntity } from "@/core/model/task";

/**
 * Collect tasks from the outside world and normalize them into TaskEntity values.
 *
 * Notes:
 * - The collector is injected from the entry boundary (Obsidian runtime).
 * - We keep this stage async to avoid mixing sync/async across adapters.
 * - Downstream stages operate on the collected array synchronously.
 */
export async function stageCollect(args: {
	collect: () => Promise<TaskEntity[]>;
}): Promise<TaskEntity[]> {
	return args.collect();
}
