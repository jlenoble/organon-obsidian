import { type DataviewInlineApi } from "obsidian-dataview";

import { buildExtendedOptions, defaultOptions, type ExtendedOptions, type Options } from "../utils";

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

export interface DecisionOptions extends Options {
	readonly viewName?: ViewName;
	readonly scoreMode?: ScoreMode;
}

export interface ExtendedDecisionOptions extends Required<DecisionOptions>, ExtendedOptions {}

const defaultDecisionOptions: Required<DecisionOptions> = {
	viewName: "cell",
	scoreMode: "mode1",

	excludeFolders: defaultOptions.excludeFolders,
};

export function buildExtendedDecisionOptions(
	options: DecisionOptions,
	dv: DataviewInlineApi,
	tasksPlugin: TasksPlugin,
): ExtendedDecisionOptions {
	const viewName = options.viewName || defaultDecisionOptions.viewName;
	const scoreMode = options.scoreMode || defaultDecisionOptions.scoreMode;

	return {
		viewName,
		scoreMode,
		...buildExtendedOptions(options, dv, tasksPlugin),
	};
}
