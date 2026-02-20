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
 * - Invoke a caller-provided collector and return TaskEntity[] output.
 * - Optionally apply a dev-only tagged subset filter when explicitly enabled.
 *
 * Non-goals:
 * - Implementing the collector here.
 * - Depending on Obsidian, Dataview, or Tasks plugin APIs.
 * - Changing ranking/recommendation policy.
 */

import type { TaskEntity } from "@/core/model/task";

/**
 * Collect tasks from the outside world and normalize them into TaskEntity values.
 *
 * Notes:
 * - The collector is injected from the entry boundary (Obsidian runtime).
 * - We keep this stage async to avoid mixing sync/async across adapters.
 * - Downstream stages operate on the collected array synchronously.
 * - When debug subset mode is enabled and no tagged tasks match, we fall back
 *   to the baseline collected set to preserve normal feed utility.
 */
export async function stageCollect(args: {
	collect: () => Promise<TaskEntity[]>;
	enableDebugSubsetMode?: boolean;
	debugSubsetTag?: string;
}): Promise<TaskEntity[]> {
	const tasks = await args.collect();

	if (!args.enableDebugSubsetMode) {
		return tasks;
	}

	const subsetTag = normalizeTagToken(args.debugSubsetTag);
	if (!subsetTag) {
		return tasks;
	}

	const subset = tasks.filter(task => hasTagToken(task, subsetTag));
	return subset.length > 0 ? subset : tasks;
}

function hasTagToken(task: TaskEntity, token: string): boolean {
	for (const tag of task.tags) {
		if (normalizeTagToken(tag) === token) {
			return true;
		}
	}
	return false;
}

function normalizeTagToken(input?: string): string {
	if (!input) {
		return "";
	}
	const trimmed = input.trim().toLowerCase();
	if (trimmed.length === 0) {
		return "";
	}
	return trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
}
