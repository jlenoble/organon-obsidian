import type { BaseScore } from "./types";

export function clamp0to5(x: number): BaseScore {
	if (Number.isNaN(x)) {
		return 0;
	}

	x = Math.floor(x);

	return Math.max(0, Math.min(5, x)) as BaseScore;
}
