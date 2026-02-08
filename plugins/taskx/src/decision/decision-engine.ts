import { type TaskX } from "../utils";
import type { ExtDvTask, ExtendedDecisionOptions } from "./decision-options";

export const basins = ["B0", "B1", "B2", "B3", "B4", "B5", "B6"] as const;
export type Basin = (typeof basins)[number];

/**
 * We model “next operator” separately from “current basin”.
 *
 * Why:
 * - Basins describe where an item currently lives (often via explicit tags, or conservative inference).
 * - Operators describe what we should do next when we look at an item from an active basin (B1/B2/B3).
 *
 * This prevents B4 from becoming a default sink while still letting us build a workshop queue.
 */
export type NextOperator = "stay" | "B4" | "B5" | "B6";

/**
 * We treat these as “technical flags”: diagnostics derived from the current data.
 * They must not silently become moral pressure or implicit authority.
 *
 * The point is to display actionable hints and keep our dispatch conservative.
 */
export type TaskFlags = {
	/** Leaf = no children in the part-of graph (i.e., not a container). */
	isLeaf: boolean;

	/** Number of children (partOf in-neighbors) we currently observe. */
	childrenCount: number;

	/** Number of prerequisites (dependsOn out-neighbors) we currently observe. */
	prereqCount: number;

	/**
	 * For now we treat “has prerequisites” as blocked.
	 * Later we should compute “open prerequisites” via a Resolved fixpoint.
	 */
	isBlockedByPrereqs: boolean;

	/** Duration is a hard requirement for B5 eligibility. */
	hasDuration: boolean;
	durationMin: number | null;

	/**
	 * Time constraints are a signal, not a routing rule.
	 * We can use them to sort or to shape hints without changing basin inference.
	 */
	hasTimeConstraint: boolean;

	/**
	 * Authority is intentionally conservative.
	 * We only classify tasks as authority when we have explicit signals (tag/config).
	 */
	isAuthority: boolean;

	/**
	 * Connectivity indicates “explosivity risk” (rumination, branching, structural complexity).
	 * We should not automatically route to B4 purely because of connectivity.
	 */
	connectivity: {
		parentCount: number;
		outgoingLinks: number; // prereqs + parents
		isStructureSmell: boolean;
	};

	/**
	 * If a basin tag exists, we treat it as explicit dispatch and we avoid fighting it.
	 */
	taggedBasin: Basin | null;

	/**
	 * If no explicit basin tag exists, we infer a conservative “home basin”.
	 * This helps us implement “B0 intake → B1/B2/B3 only”.
	 */
	inferredBasin: Basin;

	/**
	 * Current basin is the explicit basin tag if present, otherwise the inferred basin.
	 * We use this for filtering lists in decision("B_n").
	 */
	currentBasin: Basin;

	/**
	 * Next operator is a computed “what now?” suggestion.
	 * We primarily compute it for tasks that are currently in B1/B2/B3.
	 */
	nextOperator: NextOperator;

	/**
	 * Technical B5 eligibility.
	 * B5 remains “explicit commitment”, so eligibility does not mean “in B5”.
	 */
	eligibleB5: boolean;
};

/**
 * We keep “suggestedBasin” optional: our engine should not command.
 * For B5 we primarily expose “eligibleB5” rather than “suggestedBasin=B5”,
 * because B5 means real-time commitment (slot reality), not a logical category.
 */
export type DecisionHint = {
	/**
	 * In B0 we suggest a target basin (B1/B2/B3 only).
	 * In other basins, we avoid re-binning unless an explicit tag is present.
	 */
	suggestedBasin?: Basin;

	/** Technical eligibility signal, displayed as “eligible B5” rather than forced routing. */
	eligibleB5?: boolean;

	/** “Next operator” is the main signal in B1/B2/B3. */
	nextOperator?: NextOperator;

	/** Concrete blockers: why we cannot execute / commit now. */
	blockers: string[];

	/** Descriptive signals; we keep them short to avoid rumination. */
	reasons: string[];

	/** Tiny “what we do next” pointer, adapted per basin. */
	nextAction?: string;

	flags: TaskFlags;
};

/** Rows returned by decision("Bn") for rendering. */
export type DecisionRow = ExtDvTask & {
	hint: DecisionHint;
	visual: string;
};

/**
 * A B5 slot is a “bucket” we can render separately in a DVJS block.
 * Slots do not create time blocks yet; they are the minimal grouping mechanism
 * we can later refine into real scheduling.
 */
export type B5Slot = {
	/** Slot identifier used for grouping and for display headers. */
	slotId: string;

	/** Human label (optional). */
	label?: string;

	/** Candidates that fit this slot (eligible for B5 but not yet committed). */
	candidates: ExtDvTask[];

	/** Explicitly committed tasks (#b5 / #B5). */
	committed: ExtDvTask[];

	/** Compact metadata that helps DVJS render summaries. */
	stats: {
		candidateCount: number;
		committedCount: number;
		candidateMinutes: number;
		committedMinutes: number;
	};
};

/**
 * How we want to group B5.
 * - "all": one slot for everything
 * - "by-tag": derive slot from tags (rules or first matching tag)
 */
export type B5SlotMode = "all" | "by-tag";

/**
 * Slot plan configuration.
 * We keep this separate from DecisionOptions so we can evolve it without coupling.
 *
 * Our first version supports two strategies:
 * - Provide explicit rules: “if task has any of these tags -> slotId”
 * - Or fall back to a simple tag prefix (e.g. #slot/work) later
 */
export type B5SlotPlan = {
	mode: B5SlotMode;

	/**
	 * We can define explicit slot rules.
	 * Example: { slotId: "work", matchAnyTags: ["#work"] }
	 */
	rules?: Array<{
		slotId: string;
		label?: string;
		matchAnyTags: string[];
	}>;

	/**
	 * If no rule matches, we put tasks in this catch-all slot.
	 * This avoids “lost tasks” and keeps our grouping total.
	 */
	defaultSlotId?: string;
};

/** We keep helpers local and conservative. */
function durationMinutes(d?: moment.Duration): number | null {
	if (!d) {
		return null;
	}
	const m = d.asMinutes();
	return Number.isFinite(m) ? m : null;
}

function hasScheduledOrDue(t: ExtDvTask): boolean {
	return t.taskx.scheduledDate !== null || t.taskx.dueDate !== null;
}

/**
 * We read an explicit basin tag if present.
 * This is our main manual override channel for dispatching.
 */
function readTaggedBasin(taskx: TaskX): Basin | null {
	const tags: string[] = taskx.tags ?? [];
	const pick = (b: Basin): boolean =>
		tags.includes(`#${b.toLowerCase()}`) || tags.includes(`#${b}`);
	for (const b of basins) {
		if (pick(b)) {
			return b;
		}
	}
	return null;
}

/**
 * We determine authority tasks with explicit signals only.
 * This function is intentionally conservative to avoid implicit domination.
 *
 * Note:
 * - Our preprocessing can compute `task.isAuthority` directly.
 * - We keep this exported helper as a reference strategy for that preprocessing.
 */
export function isAuthorityTask(taskx: TaskX, { authorityTags }: ExtendedDecisionOptions): boolean {
	const tags: string[] = taskx.tags ?? [];
	if (tags.includes("#b3") || tags.includes("#B3")) {
		return true;
	}
	return authorityTags.some(t => tags.includes(t));
}

/**
 * We format hints compactly.
 * The goal is to help movement through the pipeline, not to create an analysis wall.
 */
function formatHintForDisplay(h: DecisionHint, basin: Basin): string {
	const short = (s: string[]): string => s.slice(0, 2).join(" · ");

	const parts: string[] = [];

	if (h.eligibleB5) {
		parts.push("✅ eligible B5");
	}

	// In B0 we show the suggested intake basin explicitly.
	if (basin === "B0" && h.suggestedBasin) {
		parts.push(`→ ${h.suggestedBasin}`);
	}

	// In B1/B2/B3 we primarily show next operator rather than basin reshuffling.
	if (basin === "B1" || basin === "B2" || basin === "B3") {
		if (h.nextOperator && h.nextOperator !== "stay") {
			parts.push(`→ ${h.nextOperator}`);
		}
	}

	if (h.blockers.length) {
		parts.push(`⛔ ${short(h.blockers)}`);
	}

	// Reasons are most useful in “operator views” (B4/B5) and in B3 closure.
	if (h.reasons.length && (basin === "B3" || basin === "B4" || basin === "B5")) {
		parts.push(`💡 ${short(h.reasons)}`);
	}

	if (h.nextAction) {
		parts.push(h.nextAction);
	}
	if (parts.length === 0) {
		return "";
	}
	return `〔${parts.join(" | ")}〕`;
}

/**
 * DecisionEngine:
 * - analyzes tasks into technical flags
 * - then produces basin-specific hints aligned with our basin semantics
 * - infers a conservative “home basin” for untagged tasks (B1/B2/B3 only)
 * - computes a “next operator” for tasks living in B1/B2/B3
 * - provides queues: workshop candidates (B4) and eligible execution candidates (B5)
 * - provides utilities to collect eligible B5 candidates and group them into slots
 */
export class DecisionEngine {
	constructor(private options: ExtendedDecisionOptions) {}

	/**
	 * We infer the intake basin for an untagged task.
	 *
	 * Our intent:
	 * - B0 does not dispatch into B4 directly.
	 * - B0 intake always yields B1 (trivial short), B2 (default candidates), or B3 (authority).
	 *
	 * We keep this conservative and stable. We can refine later, but we avoid surprising
	 * reclassification rules that would create implicit pressure.
	 */
	private inferIntakeBasin(
		flags: Omit<TaskFlags, "inferredBasin" | "currentBasin" | "nextOperator" | "eligibleB5">,
	): Basin {
		if (flags.isAuthority) {
			return "B3";
		}

		// Trivial short actions can go directly to B1 (if stable enough).
		const shortEnough =
			flags.isLeaf &&
			flags.hasDuration &&
			!flags.isBlockedByPrereqs &&
			(flags.durationMin ?? Infinity) <= this.options.thresholds.b1MaxMinutes;

		const stableEnough = !flags.connectivity.isStructureSmell;

		if (shortEnough && stableEnough) {
			return "B1";
		}

		// Default: everything else becomes a candidate for judgment.
		return "B2";
	}

	/**
	 * We compute eligibility for B5 as a pure technical predicate.
	 * B5 remains “explicit commitment”, so eligibility does not mean “we are in B5”.
	 */
	private isEligibleB5Core(
		flags: Pick<TaskFlags, "isLeaf" | "hasDuration" | "isBlockedByPrereqs">,
	): boolean {
		return flags.isLeaf && flags.hasDuration && !flags.isBlockedByPrereqs;
	}

	/**
	 * We compute the next operator for tasks that currently live in B1/B2/B3.
	 *
	 * Our intent:
	 * - From B1/B2/B3 we suggest one of:
	 *   - B5 (if leaf, unblocked, duration known)
	 *   - B4 (if we need workshop shaping: decompose/clarify/unblock/close)
	 *   - B6 (if it is already “non-actionable residue”, e.g. a parent with children)
	 *   - stay (if it is fine to execute in-place in B1, or simply remain in B2/B3 for now)
	 *
	 * We keep “B6” conservative: it should feel like explicit parking, not automatic sink.
	 */
	private computeNextOperatorCore(flags: {
		isAuthority: boolean;
		isLeaf: boolean;
		childrenCount: number;
		hasDuration: boolean;
		isBlockedByPrereqs: boolean;
		connectivity: { isStructureSmell: boolean };
		eligibleB5: boolean;
		currentBasin: Basin;
	}): NextOperator {
		// Authority tasks (B3) are primarily about explicit closure.
		// We do not auto-route them to B6, because external constraints require explicit resolution.
		if (flags.currentBasin === "B3") {
			// If it is already eligible to execute (rare but possible), we can propose B5.
			if (flags.eligibleB5) {
				return "B5";
			}

			// Otherwise, closure work belongs to workshop (B4) when we open a slot for it.
			return "B4";
		}

		// If we already have children, we treat this as a parent container.
		// Our intent is that parents are not executed; they become non-actionable after extraction.
		// If we are not currently in a workshop slot, “park” (B6) is a reasonable suggestion.
		if (!flags.isLeaf && flags.childrenCount > 0) {
			return "B6";
		}

		// If a task is eligible for execution, we suggest B5 (explicit commitment) as a next operator.
		if (flags.eligibleB5) {
			// In B1 we can also “do now” without B5 machinery; however, B5 is still useful as an explicit rail.
			// We keep the suggestion as B5 to unify the mechanism, but the view can show “do” for short actions.
			return "B5";
		}

		// If duration is missing on a leaf, we typically need clarification or estimate work.
		// We treat this as workshop candidate because it is often tied to definition quality.
		if (flags.isLeaf && !flags.hasDuration) {
			return "B4";
		}

		// Blocked tasks usually require turning prerequisites into actionable work.
		// That is workshop activity rather than parking by default.
		if (flags.isBlockedByPrereqs) {
			return "B4";
		}

		// Structural smell indicates potential explosivity; workshop is a reasonable next step.
		if (flags.connectivity.isStructureSmell) {
			return "B4";
		}

		// Default: stay where we are (usually B2 as a candidate).
		return "stay";
	}

	/**
	 * We derive technical flags from our preprocessed data (graphs, dates, durations, authority).
	 * These are observations, not decisions.
	 */
	analyzeTask(task: ExtDvTask): TaskFlags {
		const { graphs, thresholds } = this.options;
		const { dependsOn, partOf } = graphs;

		// Graph queries
		const prereqs = dependsOn.neighbors(task.id, "dependsOn", "out");
		const children = partOf.neighbors(task.id, "partOf", "in");
		const parents = partOf.neighbors(task.id, "partOf", "out");

		const prereqCount = prereqs.length;
		const childrenCount = children.length;
		const parentCount = parents.length;

		const isLeaf = childrenCount === 0;

		const durationMin = durationMinutes(task.duration);
		const hasDuration = durationMin !== null;

		const hasTimeConstraint = hasScheduledOrDue(task);

		const outgoingLinks = prereqCount + parentCount;
		const isStructureSmell = parentCount > 1 || outgoingLinks >= thresholds.b4MinOutgoingLinks;

		const taggedBasin = readTaggedBasin(task.taskx);

		// We treat `task.isAuthority` as an explicit preprocessing outcome.
		// This prevents hidden string heuristics in the engine.
		const isAuthority = task.isAuthority;

		const base = {
			isLeaf,
			childrenCount,
			prereqCount,
			isBlockedByPrereqs: prereqCount > 0, // TODO v2: openPrereqs > 0
			hasDuration,
			durationMin,
			hasTimeConstraint,
			// We assume preprocessing already computed `task.isAuthority` explicitly.
			isAuthority,
			connectivity: {
				parentCount,
				outgoingLinks,
				isStructureSmell,
			},
			taggedBasin,
		} as const;

		const inferredBasin = this.inferIntakeBasin(base);
		const currentBasin = taggedBasin ?? inferredBasin;

		const eligibleB5 = this.isEligibleB5Core(base);

		// We only compute “next operator” meaningfully for tasks that live in B1/B2/B3.
		// For B0 we use intake routing; for B4/B5/B6 the view semantics are different.
		const nextOperator =
			currentBasin === "B1" || currentBasin === "B2" || currentBasin === "B3"
				? this.computeNextOperatorCore({
						isAuthority,
						isLeaf,
						childrenCount,
						hasDuration,
						isBlockedByPrereqs: prereqCount > 0,
						connectivity: { isStructureSmell },
						eligibleB5,
						currentBasin,
					})
				: "stay";

		return {
			...base,
			inferredBasin,
			currentBasin,
			nextOperator,
			eligibleB5,
		};
	}

	/**
	 * We build a hint for a given view basin.
	 *
	 * Key semantics:
	 * - B0 is intake only: we suggest B1/B2/B3 and do not dispatch to B4 from B0.
	 * - B1/B2/B3 show the “next operator” (B5/B4/B6/stay) rather than shuffling basins.
	 * - B4 lists workshop candidates (computed queue) and focuses on “produce leaves / close / park”.
	 * - B5 lists explicit commitments + eligible candidates (for explicit commit workflow).
	 * - B6 is embargo: we only show explicit parked items + suggested parking candidates.
	 */
	renderForBasin(task: ExtDvTask, basin: Basin): DecisionHint {
		const f = this.analyzeTask(task);

		const blockers: string[] = [];
		const reasons: string[] = [];
		let nextAction: string | undefined;

		// Universal diagnostics (displayed as hints; they do not decide on their own).
		if (!f.hasDuration && f.isLeaf) {
			blockers.push("missing duration ⏱️");
		}
		if (!f.isLeaf) {
			reasons.push(`container 🌿 (${f.childrenCount})`);
		}
		if (f.isBlockedByPrereqs) {
			blockers.push(`blocked ⛔ (${f.prereqCount})`);
		}
		if (f.hasTimeConstraint) {
			reasons.push("time constraint (⏳/📅)");
		}
		if (f.connectivity.isStructureSmell) {
			reasons.push("dense structure");
		}

		switch (basin) {
			case "B0": {
				// B0 is our intake: we want a single conservative direction that helps empty the inbox.
				// - Authority -> B3
				// - Very short + stable leaf -> B1
				// - Everything else -> B2 (default candidates)
				//
				// We do not route to B4 from B0 by default; B4 is entered explicitly.
				nextAction = "→ dispatch";
				return {
					suggestedBasin: f.currentBasin, // currentBasin is inferred if untagged
					eligibleB5: f.eligibleB5,
					nextOperator: undefined,
					blockers: [],
					reasons: f.currentBasin === "B3" ? ["authority / external"] : [],
					nextAction,
					flags: f,
				};
			}

			case "B1":
			case "B2":
			case "B3": {
				// In triage basins we emphasize the next operator.
				// We keep basin movement conservative; explicit tags remain the primary dispatch.
				const op = f.nextOperator;

				if (basin === "B1") {
					// B1 is executed locally: short actions should be “do”.
					// If something is in B1 but not short/stable, we treat it as a candidate (B2) operationally.
					if (f.currentBasin === "B1") {
						const shortEnough =
							f.isLeaf &&
							f.hasDuration &&
							!f.isBlockedByPrereqs &&
							(f.durationMin ?? Infinity) <= this.options.thresholds.b1MaxMinutes;

						const stableEnough = !f.connectivity.isStructureSmell;

						nextAction = shortEnough && stableEnough ? "→ do" : "→ reclassify via B2";
					}
				}

				if (basin === "B2" && f.currentBasin === "B2") {
					if (op === "B5") {
						nextAction = "→ commit: tag #b5 (and slot tag if used)";
					} else if (op === "B4") {
						nextAction = "→ workshop: decompose/clarify/unblock";
					} else if (op === "B6") {
						nextAction = "→ park: tag #b6 (embargo)";
					} else {
						nextAction = "→ hold";
					}
				}

				if (basin === "B3" && f.currentBasin === "B3") {
					// B3 tasks require explicit closure.
					nextAction = op === "B5" ? "→ commit & execute" : "→ close: accept / negotiate / refuse";
				}

				return {
					suggestedBasin: undefined,
					eligibleB5: f.eligibleB5,
					nextOperator: op,
					blockers,
					reasons,
					nextAction,
					flags: f,
				};
			}

			case "B4": {
				// B4 is workshop: the view itself focuses on producing exits.
				// Even if a leaf is eligible, B4’s action is “commit explicitly” (tagging), not execution here.
				if (f.isAuthority) {
					return {
						suggestedBasin: "B3",
						eligibleB5: false,
						nextOperator: undefined,
						blockers: [],
						reasons: ["authority / external"],
						nextAction: "→ close",
						flags: f,
					};
				}

				if (!f.isLeaf) {
					return {
						suggestedBasin: undefined,
						eligibleB5: false,
						nextOperator: undefined,
						blockers: [],
						reasons: [`container (${f.childrenCount})`],
						nextAction: "→ produce 1–3 leaf actions (🌿) + ⏱️; then park parent (B6)",
						flags: f,
					};
				}

				if (!f.hasDuration) {
					return {
						suggestedBasin: undefined,
						eligibleB5: false,
						nextOperator: undefined,
						blockers: ["missing duration"],
						reasons: [],
						nextAction: "→ estimate ⏱️ (or split if fuzzy)",
						flags: f,
					};
				}

				if (f.isBlockedByPrereqs) {
					return {
						suggestedBasin: undefined,
						eligibleB5: false,
						nextOperator: undefined,
						blockers: ["blocked ⛔"],
						reasons: [],
						nextAction: "→ turn prereqs into leaf actions upstream",
						flags: f,
					};
				}

				return {
					suggestedBasin: undefined,
					eligibleB5: true,
					nextOperator: undefined,
					blockers: [],
					reasons: ["leaf is ready"],
					nextAction: "→ commit: tag #b5 (and slot tag if used)",
					flags: f,
				};
			}

			case "B5": {
				// B5 is explicit commitment: either the task is tagged B5 or it is a candidate.
				// We keep the hint focused on “commit and execute” vs “repair via workshop”.
				if (!f.eligibleB5) {
					const why: string[] = [];
					if (!f.isLeaf) {
						why.push("not leaf");
					}
					if (!f.hasDuration) {
						why.push("no duration");
					}
					if (f.isBlockedByPrereqs) {
						why.push("blocked");
					}

					return {
						suggestedBasin: "B4",
						eligibleB5: false,
						nextOperator: undefined,
						blockers: ["not eligible for B5", ...why],
						reasons: [],
						nextAction: "→ repair via B4",
						flags: f,
					};
				}

				return {
					suggestedBasin: undefined,
					eligibleB5: true,
					nextOperator: undefined,
					blockers: [],
					reasons: ["executable (leaf & unblocked)"],
					nextAction: f.taggedBasin === "B5" ? "→ execute in slot" : "→ commit: tag #b5",
					flags: f,
				};
			}

			case "B6": {
				// B6 is embargo: we avoid “automatic sink” behavior.
				// This view can display explicit parked tasks plus suggested parking candidates.
				return {
					suggestedBasin: undefined,
					eligibleB5: false,
					nextOperator: undefined,
					blockers: [],
					reasons: ["embargo"],
					nextAction: "→ define exit event",
					flags: f,
				};
			}

			default:
				return {
					suggestedBasin: undefined,
					eligibleB5: f.eligibleB5,
					nextOperator: undefined,
					blockers,
					reasons,
					nextAction,
					flags: f,
				};
		}
	}

	/**
	 * We decide whether a task should appear in a given basin view.
	 *
	 * Our intent:
	 * - B0 shows all untagged tasks (the inbox), plus optionally tagged B0 if we ever use it.
	 * - B1/B2/B3 show tasks whose currentBasin equals the view basin.
	 * - B4 shows computed workshop candidates (from B1/B2/B3 with nextOperator=B4), plus explicitly tagged B4.
	 * - B5 shows explicit commitments (tagged B5) plus eligible candidates (nextOperator=B5).
	 * - B6 shows explicit parked tasks (tagged B6) plus suggested parking candidates (nextOperator=B6).
	 */
	private includeInBasinView(task: ExtDvTask, basin: Basin): boolean {
		const f = this.analyzeTask(task);

		// Explicit basin tags always win for membership.
		if (f.taggedBasin === basin) {
			return true;
		}

		// Untagged tasks appear in B0 intake.
		if (basin === "B0") {
			return f.taggedBasin === null;
		}

		// Normal basins show tasks whose computed current basin matches.
		if (basin === "B1" || basin === "B2" || basin === "B3") {
			return f.taggedBasin === null && f.currentBasin === basin;
		}

		// Workshop view: computed candidates + explicit B4 tags.
		if (basin === "B4") {
			return (
				f.taggedBasin === null &&
				(f.currentBasin === "B1" || f.currentBasin === "B2" || f.currentBasin === "B3") &&
				f.nextOperator === "B4"
			);
		}

		// Execution view: explicit B5 + eligible candidates.
		if (basin === "B5") {
			return (
				f.taggedBasin === null &&
				(f.currentBasin === "B1" || f.currentBasin === "B2" || f.currentBasin === "B3") &&
				f.nextOperator === "B5"
			);
		}

		// Embargo view: explicit B6 + suggested park candidates.
		if (basin === "B6") {
			return (
				f.taggedBasin === null &&
				(f.currentBasin === "B1" || f.currentBasin === "B2" || f.currentBasin === "B3") &&
				f.nextOperator === "B6"
			);
		}

		return false;
	}

	/**
	 * We render decision rows for a given basin view.
	 *
	 * The visual string is built elsewhere as a base; we only append our hint suffix.
	 * We sort by score descending by default; basin-specific sorting can be added later.
	 */
	decision(basin: Basin, tasks: Iterable<ExtDvTask>): DecisionRow[] {
		const rows: DecisionRow[] = [];

		for (const t of tasks) {
			if (!this.includeInBasinView(t, basin)) {
				continue;
			}

			const hint = this.renderForBasin(t, basin);
			const hintText = formatHintForDisplay(hint, basin);

			rows.push({
				...t,
				hint,
				visual: hintText ? `${t.visual} ${hintText}` : t.visual,
			});
		}

		rows.sort((a, b) => b.score - a.score);
		return rows;
	}

	decideForTask(task: ExtDvTask, basin: Basin): (ExtDvTask & { hint: DecisionHint }) | null {
		if (!this.includeInBasinView(task, basin)) {
			return null;
		}

		const hint = this.renderForBasin(task, basin);
		const hintText = formatHintForDisplay(hint, basin);

		return {
			...task,
			hint,
			visual: hintText ? `${task.visual} ${hintText}` : task.visual,
		};
	}

	/**
	 * We collect eligible B5 candidates.
	 *
	 * Candidates are:
	 * - in B1/B2/B3 (current basin)
	 * - Candidates are eligible technically, but not yet committed.
	 * - nextOperator is B5
	 * - We exclude tasks already tagged B5, because they are already in the execution basin.
	 */
	collectB5Candidates(tasks: Iterable<ExtDvTask>): ExtDvTask[] {
		const out: ExtDvTask[] = [];
		for (const t of tasks) {
			const f = this.analyzeTask(t);
			if (f.taggedBasin === "B5") {
				continue;
			}

			const inTriage =
				f.currentBasin === "B1" || f.currentBasin === "B2" || f.currentBasin === "B3";
			if (!inTriage) {
				continue;
			}

			if (f.nextOperator === "B5") {
				out.push(t);
			}
		}
		out.sort((a, b) => b.score - a.score);
		return out;
	}

	/**
	 * We collect workshop (B4) candidates for processing.
	 *
	 * Candidates are:
	 * - in B1/B2/B3 (current basin)
	 * - nextOperator is B4
	 * - not explicitly tagged B4 (tagging remains an optional manual override)
	 */
	collectWorkshopCandidates(tasks: Iterable<ExtDvTask>): ExtDvTask[] {
		const out: ExtDvTask[] = [];
		for (const t of tasks) {
			const f = this.analyzeTask(t);
			if (f.taggedBasin === "B4") {
				continue;
			}

			const inTriage =
				f.currentBasin === "B1" || f.currentBasin === "B2" || f.currentBasin === "B3";
			if (!inTriage) {
				continue;
			}

			if (f.nextOperator === "B4") {
				out.push(t);
			}
		}
		out.sort((a, b) => b.score - a.score);
		return out;
	}

	/**
	 * We collect “parking suggestions” (B6 candidates).
	 *
	 * We keep this conservative:
	 * - We only suggest parking for parents that already have children (non-actionable residue),
	 *   or other cases we explicitly encode in `computeNextOperatorCore`.
	 */
	collectB6Candidates(tasks: Iterable<ExtDvTask>): ExtDvTask[] {
		const out: ExtDvTask[] = [];
		for (const t of tasks) {
			const f = this.analyzeTask(t);
			if (f.taggedBasin === "B6") {
				continue;
			}

			const inTriage =
				f.currentBasin === "B1" || f.currentBasin === "B2" || f.currentBasin === "B3";
			if (!inTriage) {
				continue;
			}

			if (f.nextOperator === "B6") {
				out.push(t);
			}
		}
		out.sort((a, b) => b.score - a.score);
		return out;
	}

	/**
	 * We collect tasks explicitly committed to B5 (#b5 / #B5).
	 * This is the “actual execution set” even before we have real time slots.
	 */
	collectCommittedB5(tasks: Iterable<ExtDvTask>): ExtDvTask[] {
		const out: ExtDvTask[] = [];
		for (const t of tasks) {
			const f = this.analyzeTask(t);
			if (f.taggedBasin === "B5") {
				out.push(t);
			}
		}
		out.sort((a, b) => b.score - a.score);
		return out;
	}

	/**
	 * We compute a slot id using a slot plan.
	 *
	 * Our “by-tag” strategy:
	 * - try explicit rules first (first match wins)
	 * - otherwise fall back to a default slot id
	 *
	 * This is intentionally minimal because DVJS interactivity is limited.
	 * Tag edits remain our explicit “commit + assign” mechanism.
	 */
	computeSlotId(taskx: TaskX, plan: B5SlotPlan): string {
		const tags = taskx.tags ?? [];

		if (plan.mode === "by-tag" && plan.rules?.length) {
			for (const rule of plan.rules) {
				if (rule.matchAnyTags.some(t => tags.includes(t))) {
					return rule.slotId;
				}
			}
		}

		return plan.defaultSlotId ?? "default";
	}

	/**
	 * We group B5 candidates and commitments into slots.
	 *
	 * This is a minimal “slot mechanism” suitable for DVJS rendering:
	 * - Slots are just grouped lists.
	 * - Committing a task to a slot remains an explicit edit action (e.g. add #b5 + slot tag later).
	 *
	 * We can evolve this into real time blocks later, but grouping is already valuable
	 * for preventing “everything eligible floods B5”.
	 */
	buildB5Slots(tasks: Iterable<ExtDvTask>, plan?: B5SlotPlan): B5Slot[] {
		const slotPlan: B5SlotPlan = plan ?? { mode: "all", defaultSlotId: "all" };

		const candidates = this.collectB5Candidates(tasks);
		const committed = this.collectCommittedB5(tasks);

		const slots = new Map<string, B5Slot>();

		const ensureSlot = (slotId: string): B5Slot => {
			let s = slots.get(slotId);
			if (!s) {
				const label = slotPlan.rules?.find(r => r.slotId === slotId)?.label;
				s = {
					slotId,
					label,
					candidates: [],
					committed: [],
					stats: {
						candidateCount: 0,
						committedCount: 0,
						candidateMinutes: 0,
						committedMinutes: 0,
					},
				};
				slots.set(slotId, s);
			}
			return s;
		};

		// Mode "all": everything goes to one slot.
		if (slotPlan.mode === "all") {
			const slotId = slotPlan.defaultSlotId ?? "all";
			const s = ensureSlot(slotId);
			s.candidates.push(...candidates);
			s.committed.push(...committed);
		} else {
			// Mode "by-tag": compute slot id by rules.
			for (const t of candidates) {
				const slotId = this.computeSlotId(t.taskx, slotPlan);
				ensureSlot(slotId).candidates.push(t);
			}
			for (const t of committed) {
				const slotId = this.computeSlotId(t.taskx, slotPlan);
				ensureSlot(slotId).committed.push(t);
			}
		}

		// Compute slot stats for rendering and for later scheduling integration.
		for (const s of slots.values()) {
			s.stats.candidateCount = s.candidates.length;
			s.stats.committedCount = s.committed.length;

			s.stats.candidateMinutes = s.candidates.reduce(
				(acc, t) => acc + (durationMinutes(t.duration) ?? 0),
				0,
			);
			s.stats.committedMinutes = s.committed.reduce(
				(acc, t) => acc + (durationMinutes(t.duration) ?? 0),
				0,
			);

			// Keep internal ordering stable: score desc.
			s.candidates.sort((a, b) => b.score - a.score);
			s.committed.sort((a, b) => b.score - a.score);
		}

		// Stable order: by slotId, unless rules order is provided.
		const ordered: B5Slot[] = Array.from(slots.values());
		if (slotPlan.mode === "by-tag" && slotPlan.rules?.length) {
			const order = new Map<string, number>();
			slotPlan.rules.forEach((r, i) => order.set(r.slotId, i));
			ordered.sort((a, b) => (order.get(a.slotId) ?? 9999) - (order.get(b.slotId) ?? 9999));
		} else {
			ordered.sort((a, b) => a.slotId.localeCompare(b.slotId));
		}

		return ordered;
	}

	/**
	 * We generate a compact summary string for slot headings in DVJS.
	 * This helps us size slots and avoid over-committing without needing extra UI.
	 */
	formatB5SlotHints(slot: B5Slot): string {
		const parts: string[] = [];

		if (slot.label) {
			parts.push(slot.label);
		}
		parts.push(`${slot.stats.committedCount} committed`);
		parts.push(`${slot.stats.candidateCount} candidates`);

		// We keep it simple: minutes are good enough for rough slot sizing.
		if (slot.stats.committedMinutes) {
			parts.push(`${Math.round(slot.stats.committedMinutes)}m committed`);
		}
		if (slot.stats.candidateMinutes) {
			parts.push(`${Math.round(slot.stats.candidateMinutes)}m candidates`);
		}

		return `〔${parts.join(" | ")}〕`;
	}
}
