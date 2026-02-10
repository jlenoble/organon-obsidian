import type { DayProfileSettings, GrandProfile } from "./profile-types";
import type { DayContext } from "./schedule-types";

export function isoDate(d: moment.Moment): string {
	return d.format("YYYY-MM-DD");
}

export function inDateRange(todayISO: string, startISO: string, endISO: string): boolean {
	return todayISO >= startISO && todayISO <= endISO;
}

export function selectorMatches(ctx: DayContext, sel: GrandProfile["selectors"][number]): boolean {
	const wd = ctx.weekday; // 0=Sun
	const today = isoDate(ctx.now);

	switch (sel.kind) {
		case "weekday":
			return wd >= 1 && wd <= 5;
		case "weekend":
			return wd === 0 || wd === 6;
		case "dateRange":
			return inDateRange(today, sel.startISO, sel.endISO);
		case "manual": {
			// reserved for later interactive selection
			return false;
		}
	}
}

export function selectGrandProfile(ctx: DayContext, settings: DayProfileSettings): GrandProfile {
	// Manual per-day override (optional)
	const todayISO = ctx.now.format("YYYY-MM-DD");
	const manualId = settings.manualByDate?.[todayISO];
	if (manualId) {
		const hit = settings.grandProfiles.find(p => p.id === manualId);
		if (hit) {
			return hit;
		}
	}

	const candidates = settings.grandProfiles
		.filter(p => p.selectors.some(sel => selectorMatches(ctx, sel)))
		.sort((a, b) => a.priority - b.priority);

	return candidates[0] ?? settings.grandProfiles[0];
}
