/**
 * core/pipeline/pipeline.ts
 *
 * This file defines the end-to-end pipeline orchestrator for TaskX (M0).
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
 * - Advanced planning stages (M2).
 * - Adapter integration (collection is still stubbed in stage-collect).
 * - UI rendering or side effects.
 */
import { stageAnalyze } from "./stage-analyze";
import { stageCollect } from "./stage-collect";
import { stageIssues } from "./stage-issues";
import { stageRank } from "./stage-rank";
import { stageRecommend } from "./stage-recommend";
import type { RecommendationFeed } from "../model/recommendation";
import type { TimeContext } from "../model/time";

/**
 * Run the TaskX pipeline end-to-end and return the UI-ready feed.
 *
 * Notes:
 * - This is the single “happy path” entry for M0 orchestration.
 * - Adapters and entry points are responsible for registering detectors and
 *   constructing TimeContext before calling this function.
 */
export function runPipeline(args: { ctx: TimeContext }): RecommendationFeed {
	const tasks = stageCollect();
	const facts = stageAnalyze(tasks);
	const issues = stageIssues({ tasks, facts, ctx: args.ctx });
	const recs = stageRecommend({ tasks, facts, issues, ctx: args.ctx });
	return stageRank(recs);
}
