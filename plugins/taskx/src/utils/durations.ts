import { extractDuration } from "./extractors";
import type { RelationGraph, TaskRecord } from "./graphs";

export type DurationFormatOptions = {
	emoji?: string; // default "⏱️"
	/**
	 * How many hours are in a "day" for display.
	 * - 24 = calendar day
	 * - 8  = typical workday
	 */
	hoursPerDay?: number; // default 24

	/** Round to nearest N minutes for display (0 disables). */
	roundToMinutes?: number; // default 5

	/** If true, show "0m" for zero; otherwise can return "" (or emoji alone). */
	showZero?: boolean; // default true

	/** If true, include units even when 0 (rarely desirable). */
	showZeroUnits?: boolean; // default false

	/**
	 * Minimum unit to display. If "h", then minutes are dropped.
	 * If "m", keep minutes.
	 */
	minUnit?: "m" | "h"; // default "m"
};

export type DurationResult = {
	durations: Map<TaskXId, moment.Duration>;
	needsDuration: Set<TaskXId>; // usually leaves missing ⏱️
	warnings: string[];
};

export function computePartOfDurations(args: {
	graph: RelationGraph<"partOf">;
	tasksById: ReadonlyMap<TaskXId, TaskRecord>;
	policy?: "leavesOnly" | "explicitOverrides";
}): DurationResult {
	const { graph, tasksById, policy = "leavesOnly" } = args;

	const durations = new Map<TaskXId, moment.Duration>();
	const needsDuration = new Set<TaskXId>();
	const warnings: string[] = [];

	// Leaf-first over the entire forest. Children are incoming edges.
	for (const id of graph.walkPostOrderAll("partOf", "in")) {
		const rec = tasksById.get(id);
		if (!rec) {
			continue;
		}

		const children = graph.neighbors(id, "partOf", "in");
		const explicit = extractDuration(rec.markdown); // moment.Duration | null

		if (children.length === 0) {
			// LEAF trigger: must be explicit
			if (!explicit) {
				needsDuration.add(id);
				continue;
			}
			durations.set(id, explicit);
			continue;
		}

		// INTERNAL trigger: children already visited (post-order), so try to aggregate
		const childDurations: moment.Duration[] = [];
		let missingChild = false;

		for (const c of children) {
			const d = durations.get(c);
			if (!d) {
				missingChild = true;
				break;
			}
			childDurations.push(d);
		}

		// Decide using policy
		if (policy === "explicitOverrides" && explicit) {
			// Warn if explicit is wildly different from sum(children)
			if (!missingChild) {
				const sum = sumDurations(childDurations);
				const delta = Math.abs(explicit.asMinutes() - sum.asMinutes());
				if (delta >= 30) {
					warnings.push(
						`Duration override on ${id}: explicit=${formatMinutes(explicit.asMinutes())} vs children=${formatMinutes(sum.asMinutes())}`,
					);
				}
			}
			durations.set(id, explicit);
			continue;
		}

		// leavesOnly (or no explicit): aggregate if possible
		if (missingChild) {
			// We can’t compute this internal node yet because some leaves are missing ⏱️.
			// Do nothing; it'll remain absent from `durations`.
			continue;
		}

		durations.set(id, sumDurations(childDurations));
	}

	return { durations, needsDuration, warnings };
}

function sumDurations(ds: moment.Duration[]): moment.Duration {
	let minutes = 0;
	for (const d of ds) {
		minutes += d.asMinutes();
	}
	return window.moment.duration(minutes, "minutes");
}

/**
 * Formats a duration like: "⏱️ 2d 3h25"
 *
 * Conventions:
 * - days separated by a space: "2d 3h25"
 * - hours/minutes glued: "3h05"
 * - minutes alone: "45m"
 */
export function formatTaskDurationToken(
	d: moment.Duration,
	opts: DurationFormatOptions = {},
): string {
	const {
		emoji = "⏱️",
		hoursPerDay = 24,
		roundToMinutes = 5,
		showZero = true,
		showZeroUnits = false,
		minUnit = "m",
	} = opts;

	// 1) Normalize to a finite number of minutes.
	let totalMinutes = d.asMinutes();
	if (!Number.isFinite(totalMinutes)) {
		return `${emoji} ${String(totalMinutes)}`.trim();
	}

	// Avoid "-0" display.
	if (Math.abs(totalMinutes) < 1e-9) {
		totalMinutes = 0;
	}

	// 2) Optional rounding for display.
	if (roundToMinutes > 0) {
		totalMinutes = Math.round(totalMinutes / roundToMinutes) * roundToMinutes;
	}

	// 3) Handle sign.
	const sign = totalMinutes < 0 ? "-" : "";
	totalMinutes = Math.abs(totalMinutes);

	if (totalMinutes === 0) {
		return showZero ? `${emoji} 0m` : `${emoji}`; // or "" if you prefer
	}

	// 4) Split into d / h / m using hoursPerDay.
	const minutesPerDay = hoursPerDay * 60;

	let days = Math.floor(totalMinutes / minutesPerDay);
	const rem = totalMinutes - days * minutesPerDay;

	let hours = Math.floor(rem / 60);
	let minutes = Math.round(rem - hours * 60);

	// Carry if rounding bumped minutes to 60.
	if (minutes === 60) {
		minutes = 0;
		hours += 1;
	}
	// Carry if hours bumped to hoursPerDay.
	if (hoursPerDay > 0 && hours >= hoursPerDay) {
		const carryDays = Math.floor(hours / hoursPerDay);
		hours = hours - carryDays * hoursPerDay;
		days += carryDays;
	}

	// 5) Apply minUnit trimming.
	if (minUnit === "h") {
		minutes = 0;
	}

	// 6) Build parts.
	const parts: string[] = [];

	if (showZeroUnits || days > 0) {
		if (days > 0 || showZeroUnits) {
			parts.push(`${days}d`);
		}
	}

	// Hours/minutes: we want either "3h25" (glued) or "45m"
	const hasHours = showZeroUnits ? true : hours > 0;
	const hasMinutes = showZeroUnits ? true : minutes > 0;

	if (hasHours) {
		if (minUnit === "m") {
			// Glue minutes if present or forced; pad if hours shown and minutes shown.
			if (hasMinutes) {
				parts.push(`${hours}h${String(minutes).padStart(2, "0")}`);
			} else {
				parts.push(`${hours}h`);
			}
		} else {
			parts.push(`${hours}h`);
		}
	} else if (hasMinutes) {
		parts.push(`${minutes}m`);
	}

	// If everything got trimmed away somehow, fall back.
	if (parts.length === 0) {
		return showZero ? `${emoji} 0m` : `${emoji}`;
	}

	// 7) Join: days separated by space; hour/minute already glued.
	const text = parts.join(" ");
	return `${emoji} ${sign}${text}`.trim();
}

/** Convenience overload if you already have minutes (number). */
export function formatMinutes(minutes: number, opts: DurationFormatOptions = {}): string {
	return formatTaskDurationToken(window.moment.duration(minutes, "minutes"), opts);
}
