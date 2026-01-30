import type { DvTask, DataArray } from "obsidian-dataview";

import { type Options } from "./extended-options";
import { makeExcludeFolders } from "./filters";

export function filterTasks(
	tasks: Array<Task>,
	dvTasks: DataArray<DvTask>,
	{ excludeFolders, keepDone }: Required<Options>,
): { tasks: Array<Task>; dvTasks: DataArray<DvTask> } {
	if (excludeFolders) {
		tasks = tasks.filter(makeExcludeFolders(excludeFolders));
		dvTasks = dvTasks.where(makeExcludeFolders(excludeFolders));
	}

	if (!keepDone) {
		tasks = tasks.filter(t => !t.status.isCompleted());
		dvTasks = dvTasks.where(t => !t.completed);
	}

	return { tasks, dvTasks };
}
