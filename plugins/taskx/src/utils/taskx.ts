import type { DvTaskStatus, DvTask } from "obsidian-dataview";

import { extractId, extractParentId } from "./extractors";
import { type TaskRecord } from "./graphs";
import { makeTempTaskId, normalizePath, normalizeTaskText } from "./temp-id";

export class TaskX {
	#task: Task;
	#dvTask: DvTask;

	#children: TaskX[];

	#description: TaskXMarkdown;
	#id: TaskXId;
	#markdown: TaskXMarkdown;
	#parentId: TaskXId | null;
	#path: TaskXPath;

	// Must be reset on every refresh, currently processTasks() is the single point of entry
	static taskMap: Map<string, Task> = new Map();
	// Must be reset on every refresh, currently processTasks() is the single point of entry
	static dvTaskMap: Map<string, DvTask> = new Map();
	// Must be reset on every refresh, currently processTasks() is the single point of entry
	static taskxMap: Map<string, TaskX> = new Map();

	get children(): TaskX[] {
		return this.#children;
	}
	set children(tasks: TaskX[]) {
		this.#children = tasks;
	}

	get createdDate(): TaskDate {
		return this.#task.createdDate?.clone() || null;
	}
	get description(): string {
		return this.#description;
	}
	get doneDate(): TaskDate {
		return this.#task.doneDate?.clone() || null;
	}
	get dueDate(): TaskDate {
		return this.#task.dueDate?.clone() || null;
	}
	get id(): TaskXId {
		return this.#id;
	}
	get line(): number {
		return this.#dvTask.line;
	}
	get markdown(): string {
		return this.#markdown;
	}
	get originalDescription(): string {
		return this.#task.description;
	}
	get originalMarkdown(): string {
		return this.#task.originalMarkdown;
	}
	get parentId(): TaskXId | null {
		return this.#parentId;
	}
	get path(): TaskXPath {
		return this.#path;
	}
	get record(): TaskRecord {
		return {
			id: this.#id,
			markdown: this.#markdown,
			path: this.#path,
		};
	}
	get startDate(): TaskDate {
		return this.#task.startDate?.clone() || null;
	}
	get scheduledDate(): TaskDate {
		return this.#task.scheduledDate?.clone() || null;
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
		this.#description = normalizeTaskText(this.#task.description);
		this.#path = normalizePath(this.#task.path);
		this.#id = TaskX.getId(this.#markdown, this.#path);
		this.#parentId = extractParentId(this.#markdown) as TaskXId | null;
	}

	static getId(text: string, path: string): TaskXId {
		let id = extractId(text);

		if (id === null) {
			id = makeTempTaskId(path, text);
		}

		return id as TaskXId;
	}

	static fromTask(task: Task): TaskX | null {
		return TaskX.fromMarkdownAndPath(task.originalMarkdown, task.path);
	}
	static fromDvTask(dvTask: DvTask): TaskX | null {
		return TaskX.fromMarkdownAndPath(dvTask.text, dvTask.path);
	}
	static fromMarkdownAndPath(markdown: string, path: string): TaskX | null {
		const id = TaskX.getId(markdown, path);

		const task = TaskX.taskMap.get(id);
		const dvTask = TaskX.dvTaskMap.get(id);

		if (!task || !dvTask) {
			return null;
		}

		return new TaskX(task, dvTask);
	}

	static getTaskXFromTask(t: Task): TaskX | undefined {
		const id = TaskX.getId(t.originalMarkdown, t.path);
		return TaskX.taskxMap.get(id);
	}
	static getTaskXFromDvTask(t: DvTask): TaskX | undefined {
		const id = TaskX.getId(t.text, t.path);
		return TaskX.taskxMap.get(id);
	}
}
