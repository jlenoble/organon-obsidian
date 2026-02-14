/**
 * core/pipeline/rank-policy.ts
 *
 * This file centralizes default ranking and presentation policy constants used
 * by stage-rank. Keeping these defaults in one place makes ownership explicit:
 * recommendation generation emits full context, while ranking decides what is
 * prioritized and how much is shown by default.
 *
 * Intent:
 * - Make feed-priority defaults explicit and easy to evolve.
 * - Prevent magic numbers from being scattered across stages.
 *
 * Non-goals:
 * - No per-user settings integration yet (handled later at entry/settings seams).
 */

import type { RecommendationKind } from "@/core/model/recommendation";

/** Default section priority for known recommendation kinds. */
export const DEFAULT_SECTION_PRIORITY: readonly RecommendationKind[] = [
	"do-now",
	"fix",
	"collected",
];

/** Default max number of fix recommendations shown in the Unblock section. */
export const MAX_UNBLOCK_RECOMMENDATIONS = 5;

/** Default max number of task summaries shown inside collected recommendations. */
export const MAX_COLLECTED_TASK_SUMMARIES = 5;

/** Default max number of task summaries shown inside do-now recommendations. */
export const MAX_DO_NOW_TASK_SUMMARIES = 5;
