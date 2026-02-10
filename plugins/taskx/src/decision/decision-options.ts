import { type DvTask } from "obsidian-dataview";

import type { Dimensions, Friction, Gain, Pressure } from "../scoring";
import type { ExtOptions, ExtendedOptions, Options, TaskX } from "../utils";
import { buildExtendedOptions, defaultOptions } from "../utils";
import type { Badge, Bin } from "./binning";
import { type Basin } from "./decision-engine";

export const DECISION_VIEW_NAMES = [
	"cell", // one cell from the decision table, with fixed Gain × Pressure
	"basin", // one bason Bn at a time
	"next", // next task, in order
	"doctor:duration", // list tasks missing durations
	"day:table", // day schedule time blocks
	"day:now", // now schedule time block
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

	/** Binning thresholds (by default: 0-1 Low, 2-3 Middle, 4-5 High) */
	bins?: {
		gain: [Gain, Gain]; // [maxLow, maxMid] ; High = above
		pressure: [Pressure, Pressure];
		friction: [Friction, Friction];
	};

	gBin?: Bin;
	pBin?: Bin;

	fBadge?: Badge;

	basin?: Basin;

	thresholds?: {
		b1MaxMinutes: number;
		b4MinOutgoingLinks: number;
	};
}

export interface ExtendedDecisionOptions extends Required<DecisionOptions>, ExtendedOptions {}
export type ExtDvTask = DvTask & {
	id: TaskXId;
	dimensions: Dimensions;
	score: number;
	duration?: moment.Duration;
	isAuthority: boolean;
	taskx: TaskX;
};

const defaultDecisionOptions: Required<DecisionOptions> = {
	viewName: "cell",
	scoreMode: "mode1",

	bins: {
		gain: [1, 3],
		pressure: [1, 3],
		friction: [1, 3],
	},

	gBin: 0,
	pBin: 0,

	fBadge: "🟢",

	basin: "B0",

	thresholds: {
		b1MaxMinutes: 15,
		b4MinOutgoingLinks: 2,
	},

	...defaultOptions,
};

export function buildExtendedDecisionOptions(
	options: DecisionOptions,
	extOptions: ExtOptions,
): ExtendedDecisionOptions {
	return {
		...defaultDecisionOptions,
		...options,
		...buildExtendedOptions(options, extOptions),
	};
}
