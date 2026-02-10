/**
 * core/registries/issue-detectors.ts
 *
 * This file defines the registry for issue detectors.
 *
 * Why a registry:
 * - We want the core pipeline to remain stable while adding many detectors over time.
 * - Each detector lives in its own feature folder and registers itself on plugin load.
 * - The pipeline depends only on the registry, not on specific detectors.
 *
 * Design goals:
 * - Minimal: just enough structure to plug detectors into stage_issues.
 * - Deterministic: registration order is preserved (useful for debugging).
 * - Pure: detectors should not mutate tasks or apply patches; they only report issues.
 */

import type { TaskFactsIndex } from "../model/facts";
import type { Issue } from "../model/issue";
import type { TaskEntity } from "../model/task";
import type { TimeContext } from "../model/time";

/**
 * IssueDetector detects issues in the current task universe.
 *
 * Notes:
 * - `id` is a stable kebab-case identifier for diagnostics and debugging.
 *   Example: "missing-duration"
 * - Detectors must be pure: they should not cause side effects.
 */
export interface IssueDetector {
	/** Stable detector identifier (kebab-case). */
	id: string;

	/**
	 * Detect issues given the current tasks, derived facts, and time context.
	 *
	 * Guidelines:
	 * - Return an empty array when nothing is detected.
	 * - Prefer producing one Issue per task per kind (avoid duplicates).
	 * - Keep evidence concise; longer explanations belong in recommendations/wizards.
	 */
	detect(args: { tasks: TaskEntity[]; facts: TaskFactsIndex; ctx: TimeContext }): Issue[];
}

/**
 * Internal detector registry.
 *
 * Notes:
 * - We keep it as an array to preserve registration order.
 * - If we later need fast lookup or deduplication by id, we can add a Map
 *   while still preserving order.
 */
const registry: IssueDetector[] = [];

/**
 * Register a detector.
 *
 * Notes:
 * - Called during plugin startup (onload) by feature modules.
 * - We do not enforce uniqueness by id yet; early development benefits from flexibility.
 *   If duplicate registrations become a problem, we can add a guard later.
 */
export function registerIssueDetector(detector: IssueDetector): void {
	registry.push(detector);
}

/**
 * List registered detectors in registration order.
 *
 * Notes:
 * - The pipeline treats this list as authoritative.
 * - Callers must not mutate the returned array.
 */
export function listIssueDetectors(): readonly IssueDetector[] {
	return registry;
}
