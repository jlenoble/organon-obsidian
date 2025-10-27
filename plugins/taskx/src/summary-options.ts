import { type DataviewInlineApi } from "obsidian-dataview";

import { makeExcludeFolders } from "./filters";
import { extractId } from "./tree";

export const SUMMARY_NAMES = [
	"hello-world", // for quick debugging
	"table", // default keyword to request the default summary table; Actual result will likely vary and introduce breaking changes
	"tree", // Prime React tree
] as const;

export const SUMMARY_GROUP_BY = [
	"none", // Tasks are taken in bulk (default)
	"file", // Tasks are grouped by file
	"tag", // Tasks are grouped by tag
] as const;

// Derive the strict union types automatically
export type SummaryName = (typeof SUMMARY_NAMES)[number];
export type SummaryGroupBy = (typeof SUMMARY_GROUP_BY)[number];

export interface SummaryOptions {
	readonly name?: SummaryName;
	readonly groupBy?: SummaryGroupBy;
	readonly excludeFolders?: string[];
}

export interface ExtendedSummaryOptions extends Required<SummaryOptions> {
	readonly dv: DataviewInlineApi;
	readonly tasksPlugin: TasksPlugin;
	readonly taskMap: Map<string, Task>;
}

export const defaultSummaryOptions: Required<SummaryOptions> = {
	name: "table",
	groupBy: "none",
	excludeFolders: ["Templates"],
};

export function buildExtendedSummaryOptions(
	options: SummaryOptions,
	dv: DataviewInlineApi,
	tasksPlugin: TasksPlugin,
): ExtendedSummaryOptions {
	const name = options.name || defaultSummaryOptions.name;
	const groupBy = options.groupBy || defaultSummaryOptions.groupBy;
	const excludeFolders = options.excludeFolders || defaultSummaryOptions.excludeFolders;

	const tasks = tasksPlugin
		.getTasks() // <-- this should return all cached tasks
		.filter(makeExcludeFolders(excludeFolders));

	const taskMap: Map<string, Task> = new Map();

	for (const task of tasks) {
		const id = extractId(task);

		if (id && !taskMap.has(id)) {
			taskMap.set(id, task);
		}
	}

	return {
		name,
		groupBy,
		excludeFolders,
		dv,
		tasksPlugin,
		taskMap,
	};
}
