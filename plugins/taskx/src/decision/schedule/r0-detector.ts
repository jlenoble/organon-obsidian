import type { ExtDvTask } from "../decision-options";

function hasTag(t: ExtDvTask, tag: string): boolean {
	const tags = t.taskx.tags ?? [];
	return tags.includes(tag);
}

function sameDay(a: moment.Moment, b: moment.Moment): boolean {
	return a.isSame(b, "day");
}

/**
 * - We maintain one daily R0 task (tagged #r0).
 * - Done tasks are excluded upstream, so if we still see it, it is not done.
 * - We consider it “today's R0” if:
 *   - it is scheduled today (preferred) OR
 *   - it has a due date today OR
 *   - it has neither scheduled nor due date, but it exists (fallback, conservative).
 */
export function isR0DoneFromTasks(args: {
	now: moment.Moment;
	tasks: ExtDvTask[];
	r0Tags?: string[]; // allow aliases
}): { isDone: boolean; openR0Task: ExtDvTask | null; reason: string } {
	const tags = args.r0Tags?.length ? args.r0Tags : ["#r0", "#R0"];

	const r0 = args.tasks.find(t => tags.some(tag => hasTag(t, tag))) ?? null;

	if (!r0) {
		return { isDone: true, openR0Task: null, reason: "no open #r0 task found" };
	}

	const sd = r0.taskx.scheduledDate;
	const dd = r0.taskx.dueDate;

	// Prefer “today-ness” checks when dates exist.
	if (sd && sameDay(sd, args.now)) {
		return { isDone: false, openR0Task: r0, reason: "#r0 scheduled today" };
	}
	if (dd && sameDay(dd, args.now)) {
		return { isDone: false, openR0Task: r0, reason: "#r0 due today" };
	}

	// If it has a date but not today, we do NOT block the whole day.
	// This avoids “yesterday's leftover r0 blocks today”.
	if (sd || dd) {
		return { isDone: true, openR0Task: r0, reason: "#r0 exists but not for today → not gating" };
	}

	// Conservative fallback: a timeless open #r0 blocks.
	return { isDone: false, openR0Task: r0, reason: "open timeless #r0 task found" };
}
