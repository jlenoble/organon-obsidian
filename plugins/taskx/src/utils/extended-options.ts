import { type DataviewInlineApi } from "obsidian-dataview";

import { makeExcludeFolders } from "./filters";
import { processTasks, type ProcessedTasks } from "./process-tasks";

export interface Options {
	readonly excludeFolders?: string[];
}

export interface ExtendedOptions extends Required<Options>, ProcessedTasks {
	readonly dv: DataviewInlineApi;
	readonly tasksPlugin: TasksPlugin;
}

export const defaultOptions: Required<Options> = {
	excludeFolders: ["Templates"],
};

export function buildExtendedOptions(
	options: Options,
	dv: DataviewInlineApi,
	tasksPlugin: TasksPlugin,
): ExtendedOptions {
	const excludeFolders = options.excludeFolders || defaultOptions.excludeFolders;

	const tasks = tasksPlugin
		.getTasks() // <-- this should return all cached tasks
		.filter(makeExcludeFolders(excludeFolders));
	const dvTasks = dv.pages().file.tasks.where(makeExcludeFolders(excludeFolders));

	return {
		excludeFolders,
		dv,
		tasksPlugin,
		...processTasks(tasks, dvTasks),
	};
}
