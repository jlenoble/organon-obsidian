import type { DvTask, DataArray } from "obsidian-dataview";

import { type Options } from "./extended-options";
import { extractId } from "./extractors";
import { filterTasks } from "./filter-tasks";
import { buildTaskNodes, type TaskNode } from "./nodes";
import { Taskx } from "./taskx";
import { makeTempTaskId } from "./temp-id";

export interface ProcessedTasks {
	/** All tasks, some have a temporary ids regenerated on each refresh */
	readonly taskMap: Map<string, Taskx>;
	/** Tasks that have no permanent ids */
	readonly tasksMissingIds: Array<Task>;
	/** Tasks that have already used ids */
	readonly tasksUsurpingIds: Array<Task>;
	/** Inheritance tree when tasks are split into smaller tasks */
	readonly taskNodes: Array<TaskNode>;
	/** Tasks as collected by Tasks plugin */
	readonly tasks: Array<Task>;
	/** Tasks as collected by Dataview plugin */
	readonly dvTasks: DataArray<DvTask>;
}

export function processTasks(
	tasks0: Array<Task>,
	dvTasks0: DataArray<DvTask>,
	options: Required<Options>,
): ProcessedTasks {
	const taskMap: Map<string, Taskx> = new Map();
	const tasksMissingIds: Task[] = [];
	const tasksUsurpingIds: Task[] = [];

	const { tasks, dvTasks } = filterTasks(tasks0, dvTasks0, options);

	Taskx.taskMap = new Map();
	Taskx.dvTaskMap = new Map();

	for (const task of tasks) {
		let id = extractId(task.originalMarkdown ?? "");

		if (id === null) {
			tasksMissingIds.push(task);
			id = makeTempTaskId(task.path, task.originalMarkdown);
		}

		if (!Taskx.taskMap.has(id)) {
			Taskx.taskMap.set(id, task);
		} else {
			tasksUsurpingIds.push(task);
		}
	}

	for (const dvTask of dvTasks) {
		let id = extractId(dvTask.text ?? "");

		if (id === null) {
			id = makeTempTaskId(dvTask.path, dvTask.text);
		}

		if (!Taskx.dvTaskMap.has(id)) {
			Taskx.dvTaskMap.set(id, dvTask);
		}
	}

	if (Taskx.dvTaskMap.size !== Taskx.taskMap.size) {
		throw new Error("Dataview and Tasks don't collect the same number of tasks");
	}

	const sanityCheck: Set<string> = new Set(Taskx.taskMap.keys());
	for (const key of Taskx.dvTaskMap.keys()) {
		sanityCheck.add(key);
	}

	if (Taskx.dvTaskMap.size !== sanityCheck.size) {
		throw new Error("Dataview and Tasks don't collect the same tasks");
	}

	for (const [key, dvTask] of Taskx.dvTaskMap.entries()) {
		taskMap.set(key, new Taskx(Taskx.taskMap.get(key)!, dvTask));
	}

	const taskNodes: TaskNode[] = buildTaskNodes(Taskx.taskMap);

	Taskx.taskxMap = taskMap;

	return {
		taskMap,
		tasksMissingIds,
		tasksUsurpingIds,
		taskNodes,
		tasks,
		dvTasks,
	};
}
