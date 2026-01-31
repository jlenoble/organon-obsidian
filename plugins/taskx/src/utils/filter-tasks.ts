import type { DvTask, DataArray } from "obsidian-dataview";

import { type Options } from "./extended-options";
import { makeExcludeFolders } from "./filters";

export function filterTasks(
	tasks: Array<Task>,
	dvTasks: DataArray<DvTask>,
	{ excludeFolders, keepDone, keepNotStarted }: Required<Options>,
): { tasks: Array<Task>; dvTasks: DataArray<DvTask> } {
	const now = window.moment();

	if (excludeFolders) {
		tasks = tasks.filter(makeExcludeFolders(excludeFolders));
		dvTasks = dvTasks.where(makeExcludeFolders(excludeFolders));
	}

	if (!keepDone) {
		tasks = tasks.filter(t => !t.status.isCompleted());
		dvTasks = dvTasks.where(t => !t.completed);
	}

	if (!keepNotStarted) {
		tasks = tasks.filter(t => !t.startDate || t.startDate.isBefore(now));
		dvTasks = dvTasks.where(t => !t.start || t.start.toUnixInteger() < now.unix());
	}

	return { tasks, dvTasks };
}
