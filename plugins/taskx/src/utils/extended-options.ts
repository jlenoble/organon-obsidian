import { type DataviewInlineApi } from "obsidian-dataview";

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
	const opts: Required<Options> = { ...defaultOptions, ...options };

	const tasks = tasksPlugin.getTasks(); // <-- this should return all cached tasks
	const dvTasks = dv.pages().file.tasks;

	return {
		...opts,
		dv,
		tasksPlugin,
		...processTasks(tasks, dvTasks, opts),
	};
}
