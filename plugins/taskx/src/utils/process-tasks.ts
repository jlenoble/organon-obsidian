import type { DvTaskStatus, DvTask, DataArray } from "obsidian-dataview";

import { type Options } from "./extended-options";
import { extractId, extractParentId } from "./extractors";
import { makeExcludeFolders } from "./filters";
import { makeTempTaskId, normalizePath, normalizeTaskText } from "./temp-id";

export class Taskx {
	#task: Task;
	#dvTask: DvTask;

	#children: Taskx[];
	#markdown: string;
	#path: string;

	// Must be reset on every refresh, currently processTasks() is the single point of entry
	static taskMap: Map<string, Task> = new Map();
	// Must be reset on every refresh, currently processTasks() is the single point of entry
	static dvTaskMap: Map<string, DvTask> = new Map();
	// Must be reset on every refresh, currently processTasks() is the single point of entry
	static taskxMap: Map<string, Taskx> = new Map();

	get children(): Taskx[] {
		return this.#children;
	}
	set children(tasks: Taskx[]) {
		this.#children = tasks;
	}

	get doneDate(): TaskDate {
		return this.#task.doneDate;
	}
	get line(): number {
		return this.#dvTask.line;
	}
	get markdown(): string {
		return this.#markdown;
	}
	get originalMarkdown(): string {
		return this.#task.originalMarkdown;
	}
	get path(): string {
		return this.#path;
	}
	get status(): DvTaskStatus {
		return this.#dvTask.status;
	}
	get tags(): string[] {
		return this.#task.tags;
	}
	get task(): true {
		return true;
	}
	get text(): string {
		return this.#dvTask.text;
	}

	constructor(task: Task, dvTask: DvTask) {
		this.#task = task;
		this.#dvTask = dvTask;

		this.#children = [];
		this.#markdown = normalizeTaskText(this.#task.originalMarkdown);
		this.#path = normalizePath(this.#task.path);
	}

	static getId(text: string, path: string): string {
		let id = extractId(text);

		if (id === null) {
			id = makeTempTaskId(path, text);
		}

		return id;
	}

	static fromTask(task: Task): Taskx | null {
		return Taskx.fromMarkdownAndPath(task.originalMarkdown, task.path);
	}
	static fromDvTask(dvTask: DvTask): Taskx | null {
		return Taskx.fromMarkdownAndPath(dvTask.text, dvTask.path);
	}
	static fromMarkdownAndPath(markdown: string, path: string): Taskx | null {
		const id = Taskx.getId(markdown, path);

		const task = Taskx.taskMap.get(id);
		const dvTask = Taskx.dvTaskMap.get(id);

		if (!task || !dvTask) {
			return null;
		}

		return new Taskx(task, dvTask);
	}

	static getTaskxFromTask(t: Task): Taskx | undefined {
		const id = Taskx.getId(t.originalMarkdown, t.path);
		return Taskx.taskxMap.get(id);
	}
	static getTaskxFromDvTask(t: DvTask): Taskx | undefined {
		const id = Taskx.getId(t.text, t.path);
		return Taskx.taskxMap.get(id);
	}
}

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

export function buildTaskNodes(taskMap: Map<string, Task>): TaskNode[] {
	const taskNodeMap: Map<string, TaskNode> = new Map();

	// Build lookup by ID
	for (const [id, task] of taskMap) {
		const parentId = extractParentId(task.originalMarkdown ?? "");
		taskNodeMap.set(id, { id, parentId, children: [], data: task });
	}

	const taskNodes: TaskNode[] = [];

	// Construct hierarchy
	for (const taskNode of taskNodeMap.values()) {
		if (!taskNode.parentId) {
			taskNodes.push(taskNode);
		} else {
			const parentTaskNode = taskNodeMap.get(taskNode.parentId);

			if (parentTaskNode) {
				parentTaskNode.children.push(taskNode);
			}
		}
	}

	return taskNodes;
}
