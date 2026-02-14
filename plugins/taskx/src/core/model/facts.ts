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
import type { ISODate, TaskEntity } from "./task";

/**
 * TaskFacts are computed properties about a specific task.
 *
 * Important:
 * - Facts do not mutate tasks.
 * - Facts are “observations”, not “recommendations”.
 */
export interface TaskFacts {
	/** Status projection kept in facts for stage-local policy composition. */
	status: TaskEntity["status"];

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
	 * Task start-date projection copied from TaskEntity.
	 *
	 * Notes:
	 * - Preserved in facts so downstream stages can remain fact-driven.
	 * - Time-relative interpretation (e.g., future-start) is decided later with TimeContext.
	 */
	startDate?: ISODate;

	/**
	 * Task due-date projection copied from TaskEntity.
	 *
	 * Notes:
	 * - Preserved in facts so downstream stages can remain fact-driven.
	 * - Time-relative interpretation (e.g., due-soon/overdue) is decided later with TimeContext.
	 */
	dueDate?: ISODate;

	/** True when a task has an explicit start-date constraint. */
	hasStartDate: boolean;

	/** True when a task has an explicit due-date constraint. */
	hasDueDate: boolean;

	/**
	 * Whether the task is blocked by dependencies.
	 *
	 * Notes:
	 * - This is a placeholder fact for M1.4 wiring.
	 * - It remains false until dependency graph facts are introduced.
	 */
	isBlocked: boolean;

	/**
	 * Whether the task is not directly executable because decomposition is still required.
	 *
	 * Notes:
	 * - This mirrors isLeaf for now and gives downstream stages a stable
	 *   actionability-focused fact name.
	 */
	isNonLeaf: boolean;

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
			status: t.status,
			isLeaf: true,
			hasDuration,
			startDate: t.dates.start,
			dueDate: t.dates.due,
			hasStartDate: typeof t.dates.start === "string" && t.dates.start.length > 0,
			hasDueDate: typeof t.dates.due === "string" && t.dates.due.length > 0,
			isBlocked: false,
			isNonLeaf: false,
			isExecutableNow: t.status === "todo" && hasDuration,
		});
	}

	return { byId };
}
