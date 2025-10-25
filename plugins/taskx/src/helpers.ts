import { makeExcludeFolders } from "./filters";
import { type ExtendedSummaryOptions } from "./summary-options";

type Task = ObsidianTasks.Task;

export function groupByFilePath(tasks: readonly Task[]): Map<string, Task[]> {
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

export function getTasksGroupedByFile(options: ExtendedSummaryOptions): Map<string, Task[]> {
	const { tasksPlugin } = options;
	const tasks = tasksPlugin.getTasks(); // <-- this should return all cached tasks

	// Filter tasks
	const filtered = tasks.filter(makeExcludeFolders(options));

	// Group tasks
	return groupByFilePath(filtered);
}
