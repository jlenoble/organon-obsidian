/**
 * features/issues/missing-duration/index.ts
 *
 * This file provides the first concrete issue feature for TaskX: missing-duration.
 * It detects leaf todo tasks that have no usable duration and reports a structured
 * Issue with a minimal fix candidate.
 *
 * The feature owns detection and fix suggestion policy for this issue kind.
 * The pipeline remains generic and consumes this only through the registry seam.
 *
 * Intent:
 * - Make "why nothing is executable" visible as a concrete issue.
 * - Provide a low-risk, mechanical first fix option.
 *
 * Limits:
 * - We use a single default duration suggestion (15m) for now.
 * - We do not apply patches here; this is only detection + suggestion.
 */

import type { FixCandidate, FixConfidence, FixImpact } from "@/core/model/fix";
import { asFixCandidateId, asFixId, asIssueId } from "@/core/model/id";
import type { TaskId } from "@/core/model/id";
import type { Issue } from "@/core/model/issue";
import type { TaskEntity } from "@/core/model/task";
import type { IssueDetector } from "@/core/registries/issue-detectors";
import { registerIssueDetector } from "@/core/registries/issue-detectors";

const ISSUE_KIND = "missing-duration";
const DEFAULT_DURATION_MINUTES = 15;

function buildSetDurationFix(taskId: TaskId, minutes: number): FixCandidate {
	const recipeId = asFixId(`fix:set-duration-${minutes}m`);

	const confidence: FixConfidence = 2;
	const impact: FixImpact = "medium";

	return {
		id: asFixCandidateId(`fixcand:${ISSUE_KIND}:${String(taskId)}:${String(recipeId)}`),
		recipeId,
		label: `Set duration to ${minutes} minutes`,
		confidence,
		impact,
		actions: [{ type: "set-duration", minutes }],
	};
}

function buildIssue(task: TaskEntity): Issue {
	const issueId = asIssueId(`${ISSUE_KIND}:${String(task.id)}`);

	return {
		id: issueId,
		target: task.id,
		severity: "blocker",
		evidence: [
			"Task is a leaf and has no duration.",
			"A duration is required by the current do-now policy.",
		],
		fixes: [buildSetDurationFix(task.id, DEFAULT_DURATION_MINUTES)],
	};
}

/**
 * Detector for leaf todo tasks that are missing duration.
 *
 * Notes:
 * - Uses TaskFacts as the source of truth for leaf/duration status.
 * - Keeps output deterministic by iterating tasks in input order.
 */
export const missingDurationIssueDetector: IssueDetector = {
	id: ISSUE_KIND,
	detect(args) {
		const out: Issue[] = [];

		for (const task of args.tasks) {
			if (task.status !== "todo") {
				continue;
			}

			const facts = args.facts.byId.get(task.id);
			if (!facts) {
				continue;
			}

			if (!facts.isLeaf || facts.hasDuration) {
				continue;
			}

			out.push(buildIssue(task));
		}

		return out;
	},
};

registerIssueDetector(missingDurationIssueDetector);
