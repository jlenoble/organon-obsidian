import type { BaseScore } from "./types";

export function clamp0to5(x: number): BaseScore {
	if (Number.isNaN(x)) {
		return 0;
	}

	x = Math.floor(x);

	return Math.max(0, Math.min(5, x)) as BaseScore;
}

export function isFiniteNumberString(x: string): boolean {
	const n = Number(x);
	return Number.isFinite(n);
}

export function parseBaseScoreOrKeep(prev: BaseScore, raw: string): BaseScore {
	if (!raw.trim()) {
		return prev;
	}
	if (!isFiniteNumberString(raw)) {
		return prev;
	}

	return clamp0to5(Number(raw));
}
