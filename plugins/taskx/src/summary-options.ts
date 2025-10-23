import { type DataviewInlineApi } from "obsidian-dataview";

type TasksPlugin = ObsidianTasks.TasksPlugin;

export interface SummaryOptions {}

export interface ExtendedSummaryOptions extends SummaryOptions {
	dv: DataviewInlineApi;
	tasksPlugin: TasksPlugin;
}

export const defaultSummaryOptions: SummaryOptions = {};
