import type { DvTask, DataArray } from "obsidian-dataview";

import { computePartOfDurations } from "./durations";
import { type Options } from "./extended-options";
import { extractId, extractIdsByEmoji } from "./extractors";
import { filterTasks } from "./filter-tasks";
import { buildRelationGraphs, type Graphs } from "./graphs";
import { TaskX } from "./taskx";
import { makeTempTaskId } from "./temp-id";

export interface ProcessedTasks {
	/** All tasks, some have a temporary ids regenerated on each refresh */
	readonly taskMap: Map<string, TaskX>;
	/** Tasks that have no permanent ids */
	readonly tasksMissingIds: Array<Task>;
	/** Tasks that have already used ids */
	readonly tasksUsurpingIds: Array<Task>;
	/** Relation graphs between tasks */
	readonly graphs: Graphs;
	/** All collected and computed durations */
	readonly durations: Map<TaskXId, moment.Duration>;
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
	const taskMap: Map<string, TaskX> = new Map();
	const tasksMissingIds: Task[] = [];
	const tasksUsurpingIds: Task[] = [];

	const { tasks, dvTasks } = filterTasks(tasks0, dvTasks0, options);

	TaskX.taskMap = new Map();
	TaskX.dvTaskMap = new Map();

	for (const task of tasks) {
		let id = extractId(task.originalMarkdown ?? "");

		if (id === null) {
			tasksMissingIds.push(task);
			id = makeTempTaskId(task.path, task.originalMarkdown);
		}

		if (!TaskX.taskMap.has(id)) {
			TaskX.taskMap.set(id, task);
		} else {
			tasksUsurpingIds.push(task);
		}
	}

	for (const dvTask of dvTasks) {
		let id = extractId(dvTask.text ?? "");

		if (id === null) {
			id = makeTempTaskId(dvTask.path, dvTask.text);
		}

		if (!TaskX.dvTaskMap.has(id)) {
			TaskX.dvTaskMap.set(id, dvTask);
		}
	}

	if (TaskX.dvTaskMap.size !== TaskX.taskMap.size) {
		throw new Error("Dataview and Tasks don't collect the same number of tasks");
	}

	const sanityCheck: Set<string> = new Set(TaskX.taskMap.keys());
	for (const key of TaskX.dvTaskMap.keys()) {
		sanityCheck.add(key);
	}

	if (TaskX.dvTaskMap.size !== sanityCheck.size) {
		throw new Error("Dataview and Tasks don't collect the same tasks");
	}

	for (const [key, dvTask] of TaskX.dvTaskMap.entries()) {
		taskMap.set(key, new TaskX(TaskX.taskMap.get(key)!, dvTask));
	}

	TaskX.taskxMap = taskMap;

	const graphs = buildRelationGraphs(
		Array.from(taskMap.values()).map(t => t.record),
		[
			{
				kind: "dependsOn",
				emoji: "⛔",
				extractTargets: (record): TaskXId[] =>
					extractIdsByEmoji(record.markdown, "⛔") as TaskXId[],
			},
			{
				kind: "partOf",
				emoji: "🌿",
				extractTargets: (record): TaskXId[] =>
					extractIdsByEmoji(record.markdown, "🌿") as TaskXId[],
			},
		],
	);

	const tasksById = new Map(
		Array.from(graphs.partOf.walkPostOrderAll("partOf", "in")).map(id => {
			const taskx = taskMap.get(id)!;
			return [
				id,
				{
					id: id as TaskXId,
					markdown: taskx.markdown as TaskXMarkdown,
					path: taskx.path as TaskXPath,
				},
			];
		}),
	);
	const { durations } = computePartOfDurations({ graph: graphs.partOf, tasksById });

	return {
		taskMap,
		tasksMissingIds,
		tasksUsurpingIds,
		graphs,
		durations,
		tasks,
		dvTasks,
	};
}
