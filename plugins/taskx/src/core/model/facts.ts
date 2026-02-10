/**
 * core/model/facts.ts
 *
 * This file defines the “derived facts” layer: computed properties about tasks.
 *
 * Why facts exist:
 * - TaskEntity represents observed state (what the notes currently say).
 * - Many decisions require computed properties: “is this task executable?”, “is it a leaf?”,
 *   “is it blocked?”, “how stale is it?”, etc.
 * - We must keep those computations out of TaskEntity to avoid polluting the canonical model
 *   with transient or policy-dependent logic.
 *
 * Design goals:
 * - Extensible: we will add many facts over time without changing upstream adapters.
 * - Deterministic: facts should be derived solely from TaskEntity + other explicit inputs.
 * - Minimal: do not overfit early; add only what detectors/recommenders need.
 */

import type { TaskId } from "./id";
import type { TaskEntity } from "./task";

/**
 * TaskFacts are computed properties about a specific task.
 *
 * Important:
 * - Facts do not mutate tasks.
 * - Facts are “observations”, not “recommendations”.
 */
export interface TaskFacts {
	/**
	 * Whether the task is considered a leaf for the purpose of duration and executability logic.
	 *
	 * Notes:
	 * - Initially, we treat every task as a leaf (no hierarchy yet).
	 * - Later, this will be computed using relation graphs (dependsOn/partOf) and/or subtasks.
	 */
	isLeaf: boolean;

	/**
	 * Whether the task has a usable duration.
	 *
	 * Notes:
	 * - The canonical duration unit is minutes.
	 * - A missing duration is a common blocker; detectors will use this fact.
	 */
	hasDuration: boolean;

	/**
	 * Whether the task is executable “now” under the current minimal policy.
	 *
	 * Minimal policy (milestone):
	 * - status is todo
	 * - hasDuration is true
	 *
	 * Later policy extensions may include:
	 * - dependency resolution (blockedBy)
	 * - time windows / superblocks
	 * - energy/effort matching
	 * - scheduled/due gating
	 */
	isExecutableNow: boolean;
}

/**
 * Facts index for fast lookup by TaskId.
 *
 * Notes:
 * - We use a Map to keep lookups fast and explicit.
 * - Additional global aggregates (like graph SCCs) can be added later if needed.
 */
export interface TaskFactsIndex {
	byId: Map<TaskId, TaskFacts>;
}

/**
 * Build the TaskFactsIndex for a list of TaskEntity.
 *
 * This is intentionally minimal for the first milestone:
 * - isLeaf: true
 * - hasDuration: duration is a finite number
 * - isExecutableNow: todo + hasDuration
 *
 * Later, this function becomes a thin orchestrator that delegates to:
 * - relation graph builders
 * - dependency resolvers
 * - date consistency checks (still as facts, not issues)
 */
export function buildFactsIndex(tasks: TaskEntity[]): TaskFactsIndex {
	const byId = new Map<TaskId, TaskFacts>();

	for (const t of tasks) {
		const hasDuration =
			typeof t.duration === "number" && Number.isFinite(t.duration) && t.duration > 0;

		byId.set(t.id, {
			isLeaf: true,
			hasDuration,
			isExecutableNow: t.status === "todo" && hasDuration,
		});
	}

	return { byId };
}
