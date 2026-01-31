import type { BaseScore, ScoredTask } from "../scoring";

export type Bin = 0 | 1 | 2;
export type Badge = "🟢" | "🟠" | "🔴";

export interface BinnedTask extends ScoredTask {
	gBin: Bin;
	pBin: Bin;
	rBadge: Badge;
}

export function bin3(value: BaseScore, [maxLow, maxMid]: [BaseScore, BaseScore]): Bin {
	if (value <= maxLow) {
		return 0;
	}
	if (value <= maxMid) {
		return 1;
	}
	return 2;
}

export function frictionBadge(
	friction: BaseScore,
	[maxLow, maxMid]: [BaseScore, BaseScore],
): Badge {
	if (friction <= maxLow) {
		return "🟢";
	}
	if (friction <= maxMid) {
		return "🟠";
	}
	return "🔴";
}
