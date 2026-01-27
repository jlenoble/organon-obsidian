import type { DvTaskStatus, DvTask } from "obsidian-dataview";

import { extractId, extractParentId } from "./extractors";
import { makeTempTaskId, normalizePath, normalizeTaskText } from "./temp-id";

export class Taskx {
	#task: Task;
	#children: Taskx[] = [];

	// Must be reset on every refresh, currently processTasks() is the single point of entry
	static taskMap: Map<string, Task> = new Map();

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
		return this.#task.lineNumber;
	}
	get markdown(): string {
		return normalizeTaskText(this.#task.originalMarkdown);
	}
	get path(): string {
		return normalizePath(this.#task.path);
	}
	get status(): DvTaskStatus {
		const m = this.#task.originalMarkdown.match(/^\s*-\s+\[([ xX])\]/);
		return m ? (m[1] as DvTaskStatus) : " ";
	}
	get tags(): string[] {
		return Array.from(this.#task.tags);
	}
	get task(): true {
		return true;
	}
	get text(): string {
		return this.markdown;
	}

	constructor(task: Task) {
		this.#task = task;
	}

	static fromTask(task: Task): Taskx {
		return new Taskx(task);
	}
	static fromMarkdown(markdown: string, path: string): Taskx | null {
		let id = extractId(markdown);

		if (id === null) {
			id = makeTempTaskId(path, markdown);
		}

		const task = Taskx.taskMap.get(id);

		if (!task) {
			return null;
		}

		return new Taskx(task);
	}
	static fromDvTask(dvTask: DvTask): Taskx | null {
		return Taskx.fromMarkdown(dvTask.text, dvTask.path);
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
}

export function processTasks(tasks: Array<Task>): ProcessedTasks {
	const taskMap: Map<string, Taskx> = new Map();
	const tasksMissingIds: Task[] = [];
	const tasksUsurpingIds: Task[] = [];

	Taskx.taskMap = new Map();

	for (const task of tasks) {
		let id = extractId(task.originalMarkdown ?? "");

		if (id === null) {
			tasksMissingIds.push(task);
			id = makeTempTaskId(task.path, task.originalMarkdown);
		}

		if (!taskMap.has(id)) {
			Taskx.taskMap.set(id, task);
			taskMap.set(id, new Taskx(task));
		} else {
			tasksUsurpingIds.push(task);
		}
	}

	const taskNodes: TaskNode[] = buildTaskNodes(Taskx.taskMap);

	return {
		taskMap,
		tasksMissingIds,
		tasksUsurpingIds,
		taskNodes,
	};
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
