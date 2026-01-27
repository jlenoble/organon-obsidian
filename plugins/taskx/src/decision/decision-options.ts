import { type DataviewInlineApi } from "obsidian-dataview";

import { extractId, makeExcludeFolders } from "../utils";

export const DECISION_VIEW_NAMES = [
	"cell", // one cell from the decision table, with fixed Gain × Pressure
] as const;

export const SCORE_MODES = [
	"mode1", // default keyword to request the default decision score mode,
	"mode2",
] as const;

// Derive the strict union types automatically
export type ViewName = (typeof DECISION_VIEW_NAMES)[number];
export type ScoreMode = (typeof SCORE_MODES)[number];

export interface DecisionOptions {
	readonly viewName?: ViewName;
	readonly scoreMode?: ScoreMode;

	readonly excludeFolders?: string[];
}

export interface ExtendedDecisionOptions extends Required<DecisionOptions> {
	readonly dv: DataviewInlineApi;
	readonly tasksPlugin: TasksPlugin;
	readonly taskMap: Map<string, Task>;
	readonly tasksMissingIds: Task[];
	readonly tasksUsurpingIds: Task[];
}

const defaultDecisionOptions: Required<DecisionOptions> = {
	viewName: "cell",
	scoreMode: "mode1",

	excludeFolders: ["Templates"],
};

export function buildExtendedDecisionOptions(
	options: DecisionOptions,
	dv: DataviewInlineApi,
	tasksPlugin: TasksPlugin,
): ExtendedDecisionOptions {
	const viewName = options.viewName || defaultDecisionOptions.viewName;
	const scoreMode = options.scoreMode || defaultDecisionOptions.scoreMode;
	const excludeFolders = options.excludeFolders || defaultDecisionOptions.excludeFolders;

	const tasks = tasksPlugin
		.getTasks() // <-- this should return all cached tasks
		.filter(makeExcludeFolders(excludeFolders));

	const taskMap: Map<string, Task> = new Map();
	const tasksMissingIds: Task[] = [];
	const tasksUsurpingIds: Task[] = [];

	for (const task of tasks) {
		const id = extractId(task.originalMarkdown ?? "");

		if (id === null) {
			tasksMissingIds.push(task);
		} else if (!taskMap.has(id)) {
			taskMap.set(id, task);
		} else {
			tasksUsurpingIds.push(task);
		}
	}

	return {
		viewName,
		scoreMode,
		excludeFolders,
		dv,
		tasksPlugin,
		tasksMissingIds,
		tasksUsurpingIds,
		taskMap,
	};
}
