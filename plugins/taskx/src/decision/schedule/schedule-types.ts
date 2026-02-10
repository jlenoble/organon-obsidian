import type { ExtDvTask } from "../decision-options";

export type FixedEventKind = "fixed:rendezvous" | "fixed:meal" | "fixed:logistics" | "fixed:sleep";

/** Block kind answers: “What are we trying to accomplish in this slice of time?”
 * It’s teleological (goal-oriented). It should map to our basin semantics and governance steps.
 *
 * Examples (kinds):
 * - governance:r0 → decide the rail of the day
 * - op:b4-workshop → transform tasks: clarify / decompose / add durations / dispatch
 * - op:b5-execute → execute committed tasks
 * - op:b3-close → resolve authority/external constraints (accept / negotiate / refuse)
 * - op:b2-judge → triage candidates (decide next operator / tagging)
 * - fixed:* → non-negotiable anchors (meal, rendezvous, logistics...)
 *
 * A good test: if after the block you can say “what changed?” (tasks got done, or clarified,
 * or committed, or parked), that’s a kind.
 */
export type BlockKind =
	| "governance:r0"
	| "governance:b5-commit"
	| "op:b1-do-now"
	| "op:b2-judge"
	| "op:b3-close"
	| "op:b4-workshop"
	| "op:b5-execute"
	| "op:b6-embargo"
	| "fixed:meal"
	| "fixed:sleep"
	| "fixed:rendezvous"
	| "fixed:logistics";

/** Block profile answers: “What is the style / constraints of attention for this block?”
 * It’s how we do it, not what we do.
 *
 * Profiles are typically about:
 * - friction tolerance (can we handle hard things?)
 * - context switching (can we jump around?)
 * - commitment threshold (do we start big stuff?)
 * - depth vs shallowness
 *
 * Examples (profiles):
 * - deep → allow higher friction, longer uninterrupted work, fewer task switches
 * - shallow → prefer low friction, short tasks, lots of small moves ok
 * - admin → allow authority/maintenance, tagging, writing emails, organizing, scheduling
 *
 * A good test: profile should not change what the operation is; it changes which tasks fit
 * and how aggressively we pack the block.
 */
export type BlockProfile =
	| { mode: "deep" } // ok with high friction, fewer context switches
	| { mode: "shallow" } // prefer low friction
	| { mode: "admin" }; // authority ok, misc maintenance

export type DayContext = {
	now: moment.Moment;

	/**
	 * Planning horizon bounds our schedule universe (life, not job).
	 * Typical: 07:30–23:30 or 00:00–24:00.
	 */
	dayStart: moment.Moment;
	dayEnd: moment.Moment;

	// Fixed lunch constraint (you asked for it as a stable rule).
	lunchStart: moment.Moment;
	lunchMinutes: number;

	// Governance gates.
	isR0Done: boolean;
	hasB5: boolean; // do we already have explicit commitments?

	// Profile by weekday (optional; keeps it simple for now).
	weekday: number; // 0=Sunday
};

export type FixedEvent = {
	kind: FixedEventKind;
	start: moment.Moment;
	end: moment.Moment;
	label: string;

	// Helps render and helps debugging envelopes
	groupId?: string; // e.g. task id of the rendezvous
	role?: "prep" | "travel" | "recover";
};

export type FreeSlot = {
	start: moment.Moment;
	end: moment.Moment;
	minutes: number;
};

export type TimeBlockPlan = {
	kind: BlockKind;
	start: moment.Moment;
	end: moment.Moment;
	minutes: number;
	label?: string;

	// Dimensions-aware selection constraints:
	profile: BlockProfile;

	// Optional filters:
	minUrgency?: "low" | "medium" | "high" | "critical";
	allowAuthority?: boolean;

	// cap how much “workshop” vs “execution” to do in that block
	maxTasks?: number;
};

export type ScheduledItem =
	| { kind: "block"; block: TimeBlockPlan }
	| { kind: "task"; task: ExtDvTask; start: moment.Moment; end: moment.Moment; note?: string };

export type DaySchedule = {
	context: DayContext;
	fixed: FixedEvent[];
	blocks: TimeBlockPlan[];
	items: ScheduledItem[];
	diagnostics: string[];
	allTasks: ExtDvTask[];
};

export type ScheduleOptions = {
	// If omitted, we assume "not done" and we gate hard (R0 first).
	isR0Done?: boolean;

	// If omitted, we treat B5 as "not built".
	hasB5?: boolean;

	workHours?: { start: string; end: string }; // "09:00" "19:00"
	lunch?: { start: string; minutes: number };

	// Rendez-vous: default duration if missing.
	defaultRendezvousMinutes?: number;

	// Block sizing.
	executeDeepMinutes?: number;
	executeShallowMinutes?: number;
	workshopMinutes?: number;
	closeMinutes?: number;
	bufferMinutes?: number;
	r0Minutes?: number;
	b5CommitMinutes?: number;

	logistics?: {
		prepMin?: number;
		travelOneWayMin?: number;
		recoverMin?: number;
	};
};
