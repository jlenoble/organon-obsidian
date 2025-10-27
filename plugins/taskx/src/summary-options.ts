import { type DataviewInlineApi } from "obsidian-dataview";

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
}

export const defaultSummaryOptions: Required<SummaryOptions> = {
	name: "table",
	groupBy: "none",
	excludeFolders: ["Templates"],
};
