/**
 * core/pipeline/pipeline.ts
 *
 * This file defines the end-to-end pipeline orchestrator for TaskX.
 *
 * Responsibility:
 * - Run the core stages in the canonical order:
 *   collect → analyze → issues → recommend → rank
 * - Return a final RecommendationFeed that the UI can render as-is.
 *
 * Invariants:
 * - The pipeline is pure orchestration: it does not implement feature logic.
 * - The pipeline depends only on:
 *   - core/model contracts
 *   - core/registries extension points (via stages that query registries)
 * - Time must be injected via TimeContext (no ambient “now” inside stages).
 *
 * Non-goals:
 * - UI rendering or side effects.
 */

import { stageAnalyze } from "./stage-analyze";
import { stageCollect } from "./stage-collect";
import { stageIssues } from "./stage-issues";
import { stageRank } from "./stage-rank";
import { stageRecommend } from "./stage-recommend";

import type { RecommendationFeed } from "@/core/model/recommendation";
import type { TaskEntity } from "@/core/model/task";
import type { TimeContext } from "@/core/model/time";

/**
 * Run the TaskX pipeline end-to-end and return the UI-ready feed.
 *
 * The caller provides:
 * - ctx: the TimeContext (the only source of "now")
 * - collect: an async collector function that returns TaskEntity values
 *
 * Notes:
 * - Adapters and entry points are responsible for selecting a collection
 *   strategy and constructing TimeContext before calling this function.
 */
export async function runPipeline(args: {
	ctx: TimeContext;
	collect: () => Promise<TaskEntity[]>;
}): Promise<RecommendationFeed> {
	const tasks = await stageCollect({ collect: args.collect });
	const facts = stageAnalyze(tasks);
	const issues = stageIssues({ tasks, facts, ctx: args.ctx });
	const recs = stageRecommend({ tasks, facts, issues, ctx: args.ctx });
	return stageRank(recs);
}
