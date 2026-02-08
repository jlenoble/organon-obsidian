import { clampToHorizon, minutesBetween } from "./helpers";
import type { FixedEvent, DayContext, ScheduleOptions } from "./schedule-types";

/**
 * “free slot” is only free if we ignore travel + prep + recovery. In a life-wide planner,
 * fixed events implicitly generate required auxiliary blocks.
 *
 * The clean way in our scheme is:
 * - Keep rendezvous as fixed anchors.
 * - Expand them into an event envelope: prep → travel → event → travel → recovery.
 * - Then compute free slots around the envelopes, not around the raw rendezvous.
 *
 * Time blocks include necessary “logistics blocks” so the calendar is real.
 */
export type LogisticsSpec = {
	prepMin: number;
	travelOneWayMin: number;
	recoverMin: number;
};

// v0: use defaults only. (Later: parse tokens / location routes.)
export function specForRendezvous(schedule?: ScheduleOptions): LogisticsSpec {
	return {
		prepMin: schedule?.logistics?.prepMin ?? 10,
		travelOneWayMin: schedule?.logistics?.travelOneWayMin ?? 20,
		recoverMin: schedule?.logistics?.recoverMin ?? 10,
	};
}

export function mk(
	ctx: DayContext,
	base: FixedEvent,
	role: FixedEvent["role"],
	start: moment.Moment,
	minutes: number,
): FixedEvent | null {
	const e: FixedEvent = {
		kind: "fixed:logistics",
		role,
		groupId: base.groupId ?? base.label,
		label: `${role}`,
		start,
		end: start.clone().add(minutes, "minutes"),
	};
	return clampToHorizon(ctx, e);
}

/**
 * Expand rendezvous into prep/travel/recover envelopes.
 * We keep it conservative and emit diagnostics when impossible overlaps occur.
 */
export function expandWithLogistics(
	ctx: DayContext,
	fixed: FixedEvent[],
	schedule?: ScheduleOptions,
): { fixed: FixedEvent[]; diagnostics: string[] } {
	const diagnostics: string[] = [];
	const out: FixedEvent[] = [...fixed];

	const rendezvous = fixed.filter(e => e.kind === "fixed:rendezvous");

	for (const r of rendezvous) {
		const spec = specForRendezvous(schedule);

		// Create blocks around the rendezvous.
		// Order before: prep then travel (closest to event).
		const travelBeforeStart = r.start.clone().subtract(spec.travelOneWayMin, "minutes");
		const prepStart = travelBeforeStart.clone().subtract(spec.prepMin, "minutes");

		const prep = mk(ctx, r, "prep", prepStart, spec.prepMin);
		const travelBefore = mk(ctx, r, "travel", travelBeforeStart, spec.travelOneWayMin);

		const travelAfterStart = r.end.clone();
		const recoverStart = travelAfterStart.clone().add(spec.travelOneWayMin, "minutes");

		const travelAfter = mk(ctx, r, "travel", travelAfterStart, spec.travelOneWayMin);
		const recover = mk(ctx, r, "recover", recoverStart, spec.recoverMin);

		if (prep) {
			out.push(prep);
		}
		if (travelBefore) {
			out.push(travelBefore);
		}
		if (travelAfter) {
			out.push(travelAfter);
		}
		if (recover) {
			out.push(recover);
		}
	}

	// Detect impossible overlaps among fixed events (including logistics).
	const events = out.slice().sort((a, b) => a.start.valueOf() - b.start.valueOf());

	for (let i = 1; i < events.length; i++) {
		const prev = events[i - 1];
		const cur = events[i];
		if (cur.start.isBefore(prev.end)) {
			const overlap = minutesBetween(cur.start, prev.end);
			diagnostics.push(
				`Overlap (${overlap}m): ${prev.kind}${prev.role ? ":" + prev.role : ""} → ${cur.kind}${cur.role ? ":" + cur.role : ""}`,
			);
		}
	}

	return { fixed: events, diagnostics };
}
