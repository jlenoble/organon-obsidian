/**
 * core/pipeline/stage-recommend.ts
 *
 * This file defines the recommendation compilation stage of the pipeline.
 *
 * Responsibility:
 * - Convert Issue[] (problem reports) into Recommendation[] (UI-facing suggestions).
 * - Emit policy-light recommendations that help validate end-to-end throughput.
 *
 * Design goals:
 * - Keep the stage extensible: we will add more recommendation kinds over time
 *   (wizards, plans, superblock-aware suggestions, templates, etc.).
 * - Keep early behavior minimal and predictable.
 * - Keep scoring simple for now; policy-driven scoring will be introduced later.
 */

import type { TaskFactsIndex } from "../model/facts";
import { asRecommendationId } from "../model/id";
import type { Issue } from "../model/issue";
import type { Recommendation, TaskSummary } from "../model/recommendation";
import type { TaskEntity } from "../model/task";
import type { TimeContext } from "../model/time";

/**
 * Compile issues and basic action suggestions into recommendations.
 *
 * Current minimal behavior:
 * 1) Emit one "collected" recommendation listing up to N collected task ids.
 * 2) For each issue, emit a "fix" recommendation containing the issue fixes.
 * 3) Emit one "do-now" recommendation listing up to N executable tasks.
 *
 * Notes:
 * - "collected" is policy-light and exists to validate real task throughput.
 * - "do-now" stays intentionally shallow and will evolve with later planning.
 */
export function stageRecommend(args: {
	tasks: TaskEntity[];
	facts: TaskFactsIndex;
	issues: Issue[];
	ctx: TimeContext;
}): Recommendation[] {
	const recs: Recommendation[] = [];

	// 1) Policy-light collected sample (M1.0 visibility hook)
	const MAX_COLLECTED = 5;

	const collectedTasks: TaskSummary[] = args.tasks.slice(0, MAX_COLLECTED).map(t => ({
		id: t.id,
		text: t.text,
		origin: { path: t.origin.path, line: t.origin.line },
	}));

	if (collectedTasks.length > 0) {
		recs.push({
			id: asRecommendationId("rec:collected:sample"),
			kind: "collected",
			title: "Collected sample",
			why: ["Raw sample of tasks collected from the vault (no policy applied)."],
			// We keep scoring neutral here; grouping policy drives placement.
			score: { urgency: 0, friction: 0, payoff: 0 },
			tasks: collectedTasks,
		});
	}

	// 2) Issue -> "fix" recommendations
	for (const issue of args.issues) {
		recs.push({
			id: asRecommendationId(`rec:fix:${String(issue.id)}`),
			kind: "fix",
			title: "Unblock a task",
			why: issue.evidence,
			// Minimal scoring policy for now.
			score: { urgency: 70, friction: 10, payoff: 60 },
			fixes: issue.fixes,
		});
	}

	// 3) One minimal "do-now" recommendation (our first “block-like” suggestion)
	const MAX_DO_NOW = 5;

	const executableTaskIds = args.tasks
		.filter(t => args.facts.byId.get(t.id)?.isExecutableNow)
		.slice(0, MAX_DO_NOW)
		.map(t => t.id);

	recs.push({
		id: asRecommendationId("rec:do-now:shallow"),
		kind: "do-now",
		title: "Do now (shallow block)",
		why: ["These tasks appear executable under the current minimal policy (todo + duration set)."],
		score: { urgency: 40, friction: 5, payoff: 35 },
		tasks: executableTaskIds,
	});

	return recs;
}
