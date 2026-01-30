import type { DvTaskStatus, DvTask } from "obsidian-dataview";

import { extractId } from "./extractors";
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
