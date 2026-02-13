/**
 * core/pipeline/stage-analyze.ts
 *
 * This file defines the analysis stage of the pipeline.
 *
 * Responsibility:
 * - Take the raw TaskEntity[] universe produced by stage_collect.
 * - Compute derived observations (facts) about those tasks.
 * - Return a TaskFactsIndex for use by detectors and planners.
 *
 * Design goals:
 * - Keep this stage as a thin orchestration layer.
 * - All actual computation logic lives in core/model/facts.ts.
 * - This makes it easy to extend or replace fact computation strategies
 *   without changing the pipeline structure.
 */

import type { TaskFactsIndex } from "@/core/model/facts";
import { buildFactsIndex } from "@/core/model/facts";
import type { TaskEntity } from "@/core/model/task";

/**
 * Compute derived facts for the current task universe.
 *
 * Notes:
 * - This function must be pure: no side effects, no mutation of tasks.
 * - If we later introduce multiple fact builders (graphs, schedulers, etc.),
 *   this function will remain the single composition point.
 */
export function stageAnalyze(tasks: TaskEntity[]): TaskFactsIndex {
	return buildFactsIndex(tasks);
}
