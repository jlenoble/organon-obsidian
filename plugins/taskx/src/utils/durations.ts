import { extractDuration } from "./extractors";
import type { RelationGraph, TaskRecord } from "./graphs";

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

function formatMinutes(m: number): string {
	if (!Number.isFinite(m)) {
		return `${m}`;
	}
	const hh = Math.floor(m / 60);
	const mm = Math.round(m % 60);
	if (hh <= 0) {
		return `${mm}m`;
	}
	if (mm === 0) {
		return `${hh}h`;
	}
	return `${hh}h${String(mm).padStart(2, "0")}`;
}
