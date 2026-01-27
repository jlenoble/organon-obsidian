import { SUMMARY_GROUP_BY, type ExtendedSummaryOptions } from "../summary/summary-options";

export function groupByFilePath(tasks: Iterable<Task>): Map<string, Task[]> {
	// Manually group Task by file path
	const grouped: Map<string, Task[]> = new Map();

	for (const t of tasks) {
		const group = grouped.get(t.path) ?? [];
		group.push(t);

		if (!grouped.has(t.path)) {
			grouped.set(t.path, group);
		}
	}

	return grouped;
}

export function groupByTag(tasks: Iterable<Task>): Map<string, Task[]> {
	// Manually group Task by file path
	const grouped: Map<string, Task[]> = new Map();

	for (const t of tasks) {
		for (const tag of t.tags) {
			const group = grouped.get(tag) ?? [];
			group.push(t);

			if (!grouped.has(tag)) {
				grouped.set(tag, group);
			}
		}
	}

	return grouped;
}

export function getGroupedTasks(options: ExtendedSummaryOptions): Map<string, Task[]> {
	const { dv, taskMap } = options;

	// Filter tasks
	const filtered = taskMap.values();

	// Group tasks
	switch (options.groupBy) {
		case "none":
		case "file":
			return groupByFilePath(filtered);

		case "tag":
			return groupByTag(filtered);

		default:
			dv.paragraph(
				`Usage: taskx.summary({ groupBy: ${SUMMARY_GROUP_BY.map(t => '"' + t + '"').join(" | ")} });`,
			);
	}

	return new Map();
}
