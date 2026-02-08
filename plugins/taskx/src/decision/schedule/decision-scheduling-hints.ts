import type { ExtDvTask } from "../decision-options";

export type Urgency = "critical" | "high" | "medium" | "low";
export type Value = "high" | "medium" | "low";
export type BlockAffinity = "deep" | "shallow" | "admin";

export type SchedulingHint = {
	urgency: Urgency;
	value: Value;
	friction: "high" | "medium" | "low";
	affinity: BlockAffinity;
	reasons: string[];
};

export function clamp0to5(x: number): number {
	if (!Number.isFinite(x)) {
		return 0;
	}
	return Math.max(0, Math.min(5, x));
}

/**
 * We map numeric dimensions into lightweight, explainable scheduling hints.
 * We intentionally keep this decoupled from DecisionEngine to avoid a rewrite.
 */
export function computeSchedulingHint(task: ExtDvTask): SchedulingHint {
	const g = clamp0to5(task.dimensions.gain);
	const p = clamp0to5(task.dimensions.pressure);
	const f = clamp0to5(task.dimensions.friction);

	const reasons: string[] = [];

	// Urgency: primarily pressure, plus time constraints.
	let urgency: Urgency = "low";
	if (p >= 4) {
		urgency = "critical";
	} else if (p >= 3) {
		urgency = "high";
	} else if (p >= 2) {
		urgency = "medium";
	}

	if (task.taskx.dueDate || task.taskx.scheduledDate) {
		// Time constraint is a signal that often warrants earlier placement.
		reasons.push("time constraint (⏳/📅)");
		if (urgency === "low") {
			urgency = "medium";
		}
	}

	// Value: gain bucket.
	let value: Value = "low";
	if (g >= 4) {
		value = "high";
	} else if (g >= 2) {
		value = "medium";
	}

	// Friction bucket.
	let friction: "high" | "medium" | "low" = "low";
	if (f >= 4) {
		friction = "high";
	} else if (f >= 2) {
		friction = "medium";
	}

	// Block affinity:
	// - High friction tends to need deep blocks (if we do it at all).
	// - Low friction can fill shallow/admin blocks.
	let affinity: BlockAffinity = "shallow";
	if (friction === "high") {
		affinity = "deep";
	} else if (task.isAuthority) {
		affinity = "admin";
	}

	// Explainable reasons (short).
	if (urgency === "critical") {
		reasons.push("pressure≥4");
	}
	if (value === "high") {
		reasons.push("gain≥4");
	}
	if (friction === "high") {
		reasons.push("friction≥4");
	}
	if (task.isAuthority) {
		reasons.push("authority");
	}

	return { urgency, value, friction, affinity, reasons };
}
