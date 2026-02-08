import type {
	DayContext,
	FreeSlot,
	TimeBlockPlan,
	BlockKind,
	BlockProfile,
} from "./schedule-types";

/**
 * We split a free slot into sequential blocks of a given kind/profile.
 * This is a mechanical helper: policy lives in buildBlockPlan().
 */
export function splitSlot(args: {
	slotStart: moment.Moment;
	slotEnd: moment.Moment;
	blockMinutes: number;
	kind: BlockKind;
	label?: string;
	profile: BlockProfile;
	overrides?: Partial<TimeBlockPlan>;
}): TimeBlockPlan[] {
	const blocks: TimeBlockPlan[] = [];
	let cursor = args.slotStart.clone();

	while (cursor.isBefore(args.slotEnd)) {
		const end = window.moment.min(
			cursor.clone().add(args.blockMinutes, "minutes"),
			args.slotEnd.clone(),
		);
		const minutes = Math.round(window.moment.duration(end.diff(cursor)).asMinutes());
		if (minutes <= 0) {
			break;
		}

		blocks.push({
			kind: args.kind,
			start: cursor.clone(),
			end,
			minutes,
			label: args.label,
			profile: args.profile,
			...args.overrides,
		});

		cursor = end;
	}

	return blocks;
}

function minutesBetween(a: moment.Moment, b: moment.Moment): number {
	return Math.max(0, Math.round(window.moment.duration(b.diff(a)).asMinutes()));
}

function isMorning(t: moment.Moment): boolean {
	return t.hour() < 12;
}

function isEvening(t: moment.Moment): boolean {
	return t.hour() >= 18;
}

/**
 * We plan blocks (operations), not tasks.
 *
 * Our intent:
 * - R0 gate: if not done, we ONLY schedule governance blocks (R0 + maybe a single “do-now”)
 *   and we do not pretend to fill the day.
 * - Otherwise: we allocate a small mix of operational blocks:
 *   - B5 execute (primary)
 *   - B4 workshop (to keep pipeline healthy)
 *   - B3 close (if authority exists; fill layer can decide)
 *   - Buffer/admin near the end
 *
 * We do NOT bind ourselves to "work hours". freeSlots are already computed against the life horizon,
 * and already incorporate fixed events + logistics envelopes.
 */
export function buildBlockPlan(
	ctx: DayContext,
	freeSlots: FreeSlot[],
	args?: {
		// block sizing
		executeDeepMinutes?: number; // default 90
		executeShallowMinutes?: number; // default 45
		workshopMinutes?: number; // default 30
		closeMinutes?: number; // default 20
		bufferMinutes?: number; // default 15

		// governance sizing
		r0Minutes?: number; // default 35
		b5CommitMinutes?: number; // default 15

		// R0 gate behavior
		allowOneDoNowBeforeR0?: boolean; // default false
	},
): { blocks: TimeBlockPlan[]; diagnostics: string[] } {
	const diagnostics: string[] = [];
	const blocks: TimeBlockPlan[] = [];

	const execDeep = args?.executeDeepMinutes ?? 90;
	const execShallow = args?.executeShallowMinutes ?? 45;
	const workshopMin = args?.workshopMinutes ?? 30;
	const closeMin = args?.closeMinutes ?? 20;
	const bufferMin = args?.bufferMinutes ?? 15;

	const r0Min = args?.r0Minutes ?? 35;
	const b5CommitMin = args?.b5CommitMinutes ?? 15;

	const first = freeSlots[0] ?? null;

	// ----------------------------
	// Gate: R0 not done
	// ----------------------------
	if (!ctx.isR0Done) {
		diagnostics.push("R0 not done → we schedule governance only; we do not fill the day.");

		if (!first) {
			diagnostics.push("No free slot found in the day horizon for R0.");
			return { blocks, diagnostics };
		}

		// Optional: allow one tiny B1 “do now” before R0 if you want (off by default).
		if (args?.allowOneDoNowBeforeR0) {
			const pre = window.moment.min(first.start.clone().add(15, "minutes"), first.end.clone());
			const preMin = minutesBetween(first.start, pre);
			if (preMin >= 10) {
				blocks.push({
					kind: "op:b1-do-now",
					start: first.start.clone(),
					end: pre.clone(),
					minutes: preMin,
					label: "B1 do-now (pre-R0)",
					profile: { mode: "shallow" },
					allowAuthority: false,
					minUrgency: "high", // only if truly pressured
					maxTasks: 2,
				});
			}
		}

		// Schedule R0 at earliest possible time.
		const r0Start = blocks.length ? blocks[blocks.length - 1].end.clone() : first.start.clone();
		const r0End = window.moment.min(r0Start.clone().add(r0Min, "minutes"), first.end.clone());
		const minutes = minutesBetween(r0Start, r0End);

		if (minutes > 0) {
			blocks.push({
				kind: "governance:r0",
				start: r0Start,
				end: r0End,
				minutes,
				label: "R0 — decision rail",
				profile: { mode: "admin" },
				allowAuthority: true,
				minUrgency: "low",
				maxTasks: 1,
			});
		} else {
			diagnostics.push("Earliest slot was too small for R0.");
		}

		return { blocks, diagnostics };
	}

	// ----------------------------
	// If R0 done but B5 not built: small governance block early
	// ----------------------------
	if (ctx.isR0Done && !ctx.hasB5) {
		diagnostics.push(
			"B5 not present → insert a short governance block to build/refresh commitments.",
		);
		if (first) {
			const start = first.start.clone();
			const end = window.moment.min(start.clone().add(b5CommitMin, "minutes"), first.end.clone());
			const minutes = minutesBetween(start, end);
			if (minutes > 0) {
				blocks.push({
					kind: "governance:b5-commit",
					start,
					end,
					minutes,
					label: "B5 — commit rail",
					profile: { mode: "admin" },
					allowAuthority: true,
					minUrgency: "low",
					maxTasks: 5,
				});
			}
		}
	}

	// ----------------------------
	// Main plan across free slots
	// ----------------------------
	for (const s of freeSlots) {
		let start = s.start.clone();

		// If we injected a governance:b5-commit at slot start, skip it.
		const gov = blocks.find(b => b.start.isSame(start) && b.kind === "governance:b5-commit");
		if (gov) {
			start = gov.end.clone();
		}

		if (!s.end.isAfter(start)) {
			continue;
		}

		// Decide a local policy from time-of-day (very simple v0).
		// You can later refine by weekday, or by “basin pressure stats”.
		const morning = isMorning(start);
		const evening = isEvening(start);

		if (morning) {
			// Morning: one deep execute block, then (if room) a workshop block.
			blocks.push(
				...splitSlot({
					slotStart: start,
					slotEnd: s.end.clone(),
					blockMinutes: execDeep,
					kind: "op:b5-execute",
					label: "Execute (deep)",
					profile: { mode: "deep" },
					overrides: { allowAuthority: false, minUrgency: "medium" },
				}),
			);

			// Add a small workshop block at the end if there is still space >= workshopMin.
			const last = blocks[blocks.length - 1];
			if (last && minutesBetween(last.end, s.end) >= workshopMin) {
				const wsStart = last.end.clone();
				const wsEnd = window.moment.min(wsStart.clone().add(workshopMin, "minutes"), s.end.clone());
				const wsMin = minutesBetween(wsStart, wsEnd);
				if (wsMin > 0) {
					blocks.push({
						kind: "op:b4-workshop",
						start: wsStart,
						end: wsEnd,
						minutes: wsMin,
						label: "Workshop (clarify)",
						profile: { mode: "admin" },
						allowAuthority: true,
						minUrgency: "low",
						maxTasks: 6,
					});
				}
			}

			continue;
		}

		if (!evening) {
			// Midday/afternoon: execute shallow + workshop alternation.
			// We aim to keep pipeline healthy (workshop) while still executing.
			const totalMin = minutesBetween(start, s.end);
			if (totalMin <= 0) {
				continue;
			}

			// If slot is small, do a single shallow execute block.
			if (totalMin < execShallow + workshopMin) {
				blocks.push({
					kind: "op:b5-execute",
					start,
					end: s.end.clone(),
					minutes: totalMin,
					label: "Execute (shallow)",
					profile: { mode: "shallow" },
					allowAuthority: false,
					minUrgency: "medium",
				});
				continue;
			}

			// Otherwise: shallow execute then workshop, repeating.
			let cursor = start.clone();
			while (cursor.isBefore(s.end)) {
				const execEnd = window.moment.min(
					cursor.clone().add(execShallow, "minutes"),
					s.end.clone(),
				);
				const execMin = minutesBetween(cursor, execEnd);
				if (execMin <= 0) {
					break;
				}

				blocks.push({
					kind: "op:b5-execute",
					start: cursor.clone(),
					end: execEnd,
					minutes: execMin,
					label: "Execute",
					profile: { mode: "shallow" },
					allowAuthority: false,
					minUrgency: "medium",
				});

				cursor = execEnd.clone();
				if (minutesBetween(cursor, s.end) < workshopMin) {
					break;
				}

				const wsEnd = window.moment.min(cursor.clone().add(workshopMin, "minutes"), s.end.clone());
				const wsMin = minutesBetween(cursor, wsEnd);
				if (wsMin <= 0) {
					break;
				}

				blocks.push({
					kind: "op:b4-workshop",
					start: cursor.clone(),
					end: wsEnd,
					minutes: wsMin,
					label: "Workshop",
					profile: { mode: "admin" },
					allowAuthority: true,
					minUrgency: "low",
					maxTasks: 6,
				});

				cursor = wsEnd.clone();
			}

			continue;
		}

		// Evening: closure + workshop + buffer/admin.
		// We include a small B3 close block; fill() can leave it empty if no authority tasks.
		const slotMin = minutesBetween(start, s.end);
		if (slotMin <= 0) {
			continue;
		}

		// Close block
		const closeEnd = window.moment.min(start.clone().add(closeMin, "minutes"), s.end.clone());
		const closeMinutes = minutesBetween(start, closeEnd);
		if (closeMinutes > 0) {
			blocks.push({
				kind: "op:b3-close",
				start: start.clone(),
				end: closeEnd,
				minutes: closeMinutes,
				label: "Close (authority)",
				profile: { mode: "admin" },
				allowAuthority: true,
				minUrgency: "low",
				maxTasks: 5,
			});
		}

		// Workshop block
		const afterClose = closeEnd.clone();
		const wsEnd = window.moment.min(afterClose.clone().add(workshopMin, "minutes"), s.end.clone());
		const wsMinutes = minutesBetween(afterClose, wsEnd);
		if (wsMinutes > 0) {
			blocks.push({
				kind: "op:b4-workshop",
				start: afterClose,
				end: wsEnd,
				minutes: wsMinutes,
				label: "Workshop",
				profile: { mode: "admin" },
				allowAuthority: true,
				minUrgency: "low",
				maxTasks: 6,
			});
		}

		// Whatever remains becomes buffer/admin.
		const restStart = wsEnd.clone();
		const restMin = minutesBetween(restStart, s.end);
		if (restMin > 0) {
			blocks.push({
				kind: "op:b2-judge",
				start: restStart,
				end: s.end.clone(),
				minutes: restMin,
				label: "Triage / review",
				profile: { mode: "admin" },
				allowAuthority: true,
				minUrgency: "low",
				maxTasks: 8,
			});
		}
	}

	// Optional: add a buffer at end of day if space exists after last block within horizon.
	const last = blocks.length ? blocks[blocks.length - 1] : null;
	if (last && ctx.dayEnd.isAfter(last.end) && bufferMin > 0) {
		const gap = minutesBetween(last.end, ctx.dayEnd);
		if (gap >= bufferMin) {
			const start = ctx.dayEnd.clone().subtract(bufferMin, "minutes");
			blocks.push({
				kind: "op:b6-embargo",
				start,
				end: ctx.dayEnd.clone(),
				minutes: bufferMin,
				label: "Embargo / park / unwind",
				profile: { mode: "shallow" },
				allowAuthority: true,
				minUrgency: "low",
				maxTasks: 5,
			});
		}
	}

	return { blocks, diagnostics };
}
