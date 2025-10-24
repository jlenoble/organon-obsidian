import { type DataviewInlineApi } from "obsidian-dataview";

type TasksPlugin = ObsidianTasks.TasksPlugin;

export const SUMMARY_NAMES = [
	"hello-world", // for quick debugging
	"table", // default keyword to request the default summary table; Actual result will likely vary and introduce breaking changes
	"tree", // Prime React tree
] as const;

// Derive the strict union type automatically
export type SummaryName = (typeof SUMMARY_NAMES)[number];

export interface SummaryOptions {
	readonly name?: SummaryName;
}

export interface ExtendedSummaryOptions extends Required<SummaryOptions> {
	readonly dv: DataviewInlineApi;
	readonly tasksPlugin: TasksPlugin;
}

export const defaultSummaryOptions: Required<SummaryOptions> = {
	name: "table",
};
