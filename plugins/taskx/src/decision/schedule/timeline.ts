import type { ExtDvTask } from "../decision-options";
import { clampToHorizon, minutesBetween } from "./helpers";
import type { DayContext, FixedEvent, FreeSlot, ScheduleOptions } from "./schedule-types";

/**
 * We extract fixed rendez-vous events from tasks.
 * Our intent: scheduledDate is a fixed start; duration is from token if present, else a default.
 */
export function extractRendezvous(
	ctx: DayContext,
	tasks: Iterable<ExtDvTask>,
	schedule?: ScheduleOptions,
): FixedEvent[] {
	const out: FixedEvent[] = [];
	const defaultMin = schedule?.defaultRendezvousMinutes ?? 60;

	for (const t of tasks) {
		const start = t.taskx.scheduledDate;
		if (!start) {
			continue;
		}

		const durMin = t.duration?.asMinutes();
		const minutes = Number.isFinite(durMin) && (durMin ?? 0) > 0 ? Math.round(durMin!) : defaultMin;

		const s = window.moment(start);
		const e: FixedEvent = {
			kind: "fixed:rendezvous",
			start: s,
			end: s.clone().add(minutes, "minutes"),
			label: "rendez-vous",
			groupId: t.id, // helpful for logistics envelopes & debugging
		};

		const clipped = clampToHorizon(ctx, e);
		if (clipped) {
			out.push(clipped);
		}
	}

	return out.sort((a, b) => a.start.valueOf() - b.start.valueOf());
}

/**
 * We build the fixed events list (meal + rendez-vous).
 */
export function buildFixedEvents(
	ctx: DayContext,
	tasks: Iterable<ExtDvTask>,
	schedule?: ScheduleOptions,
): FixedEvent[] {
	const fixed: FixedEvent[] = [];

	// Lunch is a non-negotiable constraint.
	const meal: FixedEvent = {
		kind: "fixed:meal",
		start: ctx.lunchStart.clone(),
		end: ctx.lunchStart.clone().add(ctx.lunchMinutes, "minutes"),
		label: "lunch",
	};

	const clippedMeal = clampToHorizon(ctx, meal);
	if (clippedMeal) {
		fixed.push(clippedMeal);
	}

	fixed.push(...extractRendezvous(ctx, tasks, schedule));
	return fixed.sort((a, b) => a.start.valueOf() - b.start.valueOf());
}

/**
 * We compute free slots within the horizon window given fixed events.
 * Our intent: keep it simple and stable (no fragmentation magic yet).
 */
export function computeFreeSlots(ctx: DayContext, fixed: FixedEvent[]): FreeSlot[] {
	const events = fixed.slice().sort((a, b) => a.start.valueOf() - b.start.valueOf());

	const slots: FreeSlot[] = [];
	let cursor = ctx.dayStart.clone();

	for (const e of events) {
		if (e.start.isAfter(cursor)) {
			const start = cursor.clone();
			const end = e.start.clone();
			const minutes = minutesBetween(start, end);
			if (minutes > 0) {
				slots.push({ start, end, minutes });
			}
		}
		cursor = window.moment.max(cursor, e.end);
	}

	if (ctx.dayEnd.isAfter(cursor)) {
		const start = cursor.clone();
		const end = ctx.dayEnd.clone();
		const minutes = minutesBetween(start, end);
		if (minutes > 0) {
			slots.push({ start, end, minutes });
		}
	}

	return slots;
}
