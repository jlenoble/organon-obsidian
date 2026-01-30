import { type DataviewInlineApi } from "obsidian-dataview";

import { makeExcludeFolders } from "./filters";
import { processTasks, type ProcessedTasks } from "./process-tasks";

export interface Options {
	readonly excludeFolders?: string[];
	readonly keepDone?: boolean;
}

export interface ExtendedOptions extends Required<Options>, ProcessedTasks {
	readonly dv: DataviewInlineApi;
	readonly tasksPlugin: TasksPlugin;
}

export const defaultOptions: Required<Options> = {
	excludeFolders: ["Templates"],
	keepDone: false,
};

export function buildExtendedOptions(
	options: Options,
	dv: DataviewInlineApi,
	tasksPlugin: TasksPlugin,
): ExtendedOptions {
	const excludeFolders = options.excludeFolders || defaultOptions.excludeFolders;
	const keepDone = options.keepDone || defaultOptions.keepDone;

	let tasks = tasksPlugin
		.getTasks() // <-- this should return all cached tasks
		.filter(makeExcludeFolders(excludeFolders));
	let dvTasks = dv.pages().file.tasks.where(makeExcludeFolders(excludeFolders));

	if (!keepDone) {
		tasks = tasks.filter(t => !t.status.isCompleted());
		dvTasks = dvTasks.where(t => !t.completed);
	}

	return {
		excludeFolders,
		keepDone,
		dv,
		tasksPlugin,
		...processTasks(tasks, dvTasks),
	};
}
