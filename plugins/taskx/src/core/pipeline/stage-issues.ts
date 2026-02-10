/**
 * This file defines the issue detection stage of the pipeline.
 *
 * Responsibility:
 * - Run all registered IssueDetectors.
 * - Collect their outputs into a single Issue[] list.
 *
 * Design goals:
 * - Pure orchestration: detectors own the logic; this stage owns the wiring.
 * - Extensible: adding a new detector requires no changes here.
 * - Deterministic: detectors are executed in registry order (useful for debugging).
 */

import type { TaskFactsIndex } from "../model/facts";
import type { Issue } from "../model/issue";
import type { TaskEntity } from "../model/task";
import type { TimeContext } from "../model/time";
import { listIssueDetectors } from "../registries/issue-detectors";

/**
 * Detect issues in the current task universe.
 *
 * Notes:
 * - This stage is pure: it has no side effects and does not apply fixes.
 * - We intentionally do not deduplicate issues here; detectors should avoid duplicates.
 *   If deduplication becomes necessary, we can add it later with clear semantics.
 */
export function stageIssues(args: {
	tasks: TaskEntity[];
	facts: TaskFactsIndex;
	ctx: TimeContext;
}): Issue[] {
	const out: Issue[] = [];

	for (const detector of listIssueDetectors()) {
		out.push(...detector.detect(args));
	}

	return out;
}
