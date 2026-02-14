/**
 * core/pipeline/recommendation-signals.ts
 *
 * This file centralizes recommendation-signal definitions and derivation logic.
 *
 * Intent:
 * - Keep stage-recommend focused on recommendation orchestration.
 * - Keep signal token catalog, label mapping, and derivation rules in one place.
 *
 * Invariants:
 * - Signal ids are stable RecommendationSignalId values.
 * - Signal output order is deterministic and follows SIGNAL_TOKENS.
 * - This module is pure and fact-driven.
 */

import type { TaskFactsIndex } from "@/core/model/facts";
import { asRecommendationSignalId } from "@/core/model/id";
import type { TaskId } from "@/core/model/id";
import type { RecommendationSignal } from "@/core/model/recommendation";
import type { TimeContext } from "@/core/model/time";

const SIGNAL_TOKENS = [
	"overdue",
	"due-soon",
	"blocked",
	"missing-duration",
	"non-leaf",
	"future-start",
] as const;

type SignalToken = (typeof SIGNAL_TOKENS)[number];

const SIGNAL_CATALOG: Record<SignalToken, RecommendationSignal> = {
	overdue: { id: asRecommendationSignalId("overdue"), label: "Overdue" },
	"due-soon": { id: asRecommendationSignalId("due-soon"), label: "Due soon" },
	blocked: { id: asRecommendationSignalId("blocked"), label: "Blocked" },
	"missing-duration": {
		id: asRecommendationSignalId("missing-duration"),
		label: "Missing duration",
	},
	"non-leaf": { id: asRecommendationSignalId("non-leaf"), label: "Non-leaf" },
	"future-start": { id: asRecommendationSignalId("future-start"), label: "Future start" },
};

/**
 * Derive stable, ordered recommendation signals from task facts and time context.
 */
export function collectSignalsForTaskIds(
	taskIds: TaskId[],
	facts: TaskFactsIndex,
	ctx: TimeContext,
): RecommendationSignal[] {
	const byId = new Map<RecommendationSignal["id"], RecommendationSignal>();
	const today = dateOnly(ctx.now);

	for (const taskId of taskIds) {
		const f = facts.byId.get(taskId);
		if (!f) {
			continue;
		}

		if (f.dueDate && f.dueDate < today) {
			byId.set(SIGNAL_CATALOG.overdue.id, SIGNAL_CATALOG.overdue);
		} else if (f.dueDate && isDueSoon(f.dueDate, today)) {
			byId.set(SIGNAL_CATALOG["due-soon"].id, SIGNAL_CATALOG["due-soon"]);
		}

		if (f.isBlocked) {
			byId.set(SIGNAL_CATALOG.blocked.id, SIGNAL_CATALOG.blocked);
		}

		if (!f.hasDuration) {
			byId.set(SIGNAL_CATALOG["missing-duration"].id, SIGNAL_CATALOG["missing-duration"]);
		}

		if (f.isNonLeaf || !f.isLeaf) {
			byId.set(SIGNAL_CATALOG["non-leaf"].id, SIGNAL_CATALOG["non-leaf"]);
		}

		if (f.startDate && f.startDate > today) {
			byId.set(SIGNAL_CATALOG["future-start"].id, SIGNAL_CATALOG["future-start"]);
		}
	}

	return SIGNAL_TOKENS.map(token => SIGNAL_CATALOG[token]).filter(signal => byId.has(signal.id));
}

function dateOnly(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function isDueSoon(dueDate: string, today: string): boolean {
	const todayUtc = Date.parse(`${today}T00:00:00Z`);
	const dueUtc = Date.parse(`${dueDate}T00:00:00Z`);

	if (!Number.isFinite(todayUtc) || !Number.isFinite(dueUtc)) {
		return false;
	}

	const dayMs = 24 * 60 * 60 * 1000;
	const diffDays = Math.floor((dueUtc - todayUtc) / dayMs);

	// Policy-light default for M1.4:
	// - due-soon means due today or within the next 2 days.
	return diffDays >= 0 && diffDays <= 2;
}
