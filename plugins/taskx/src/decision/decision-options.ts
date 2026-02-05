import type { Friction, Gain, Pressure } from "../scoring";
import type { ExtOptions, ExtendedOptions, Options } from "../utils";
import { buildExtendedOptions, defaultOptions } from "../utils";
import type { Badge, Bin } from "./binning";

export const DECISION_VIEW_NAMES = [
	"cell", // one cell from the decision table, with fixed Gain × Pressure
	"next", // next task, in order
	"doctor:duration", // list tasks missing durations
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
}

export interface ExtendedDecisionOptions extends Required<DecisionOptions>, ExtendedOptions {}

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
