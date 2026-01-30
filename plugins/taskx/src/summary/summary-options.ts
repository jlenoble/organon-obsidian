import { type DataviewInlineApi } from "obsidian-dataview";

import { buildExtendedOptions, defaultOptions, type ExtendedOptions, type Options } from "../utils";

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

export interface SummaryOptions extends Options {
	readonly name?: SummaryName;
	readonly groupBy?: SummaryGroupBy;
}

export interface ExtendedSummaryOptions extends Required<SummaryOptions>, ExtendedOptions {}

const defaultSummaryOptions: Required<SummaryOptions> = {
	name: "table",
	groupBy: "none",
	...defaultOptions,
};

export function buildExtendedSummaryOptions(
	options: SummaryOptions,
	dv: DataviewInlineApi,
	tasksPlugin: TasksPlugin,
): ExtendedSummaryOptions {
	const name = options.name || defaultSummaryOptions.name;
	const groupBy = options.groupBy || defaultSummaryOptions.groupBy;

	return {
		name,
		groupBy,
		...buildExtendedOptions(options, dv, tasksPlugin),
	};
}
