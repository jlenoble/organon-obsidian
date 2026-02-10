import type { BlockKind, BlockProfile, ScheduleOptions } from "./schedule-types";

export type Window = { start: string; end: string }; // "09:00" -> "12:00"

export type RecipeWhen =
	| { kind: "always" }
	| { kind: "weekday"; days: number[] } // 0=Sun
	| { kind: "weekend" }
	| { kind: "dateRange"; startISO: string; endISO: string }; // inclusive

export type BlockRecipe = {
	id: string;
	label?: string;

	/** Time window within the day horizon, local time */
	window: Window;

	/** Operation kind (teleological) */
	kind: BlockKind;

	/** Attention profile (deep/shallow/admin) */
	profile: BlockProfile;

	/** Split policy */
	chunkMinutes: number;

	/** Optional gates/filters */
	allowAuthority?: boolean;
	minUrgency?: "low" | "medium" | "high" | "critical";
	maxTasks?: number;

	when?: RecipeWhen;

	/**
	 * A priority number (lower wins) for ordering within the same window.
	 * This is for deterministic projection when multiple recipes cover same minutes.
	 */
	priority?: number;
};

export type RecipePack = {
	id: string;
	label: string;
	recipes: BlockRecipe[];
};

export type GrandProfileSelector =
	| { kind: "weekday" } // Mon–Fri
	| { kind: "weekend" } // Sat–Sun
	| { kind: "dateRange"; startISO: string; endISO: string }
	| { kind: "manual"; id: string }; // for later explicit selection

export type GrandProfile = {
	id: string;
	label: string;

	/**
	 * Priority for selection. Lower means “wins earlier”.
	 * Example: vacation profile priority 10, weekday profile priority 100.
	 */
	priority: number;

	selectors: GrandProfileSelector[];

	/** Packs enabled for this grand profile, in apply order */
	packIds: string[];

	/**
	 * Optional day defaults overriding ScheduleOptions:
	 * - dayHours/lunch/sleep etc.
	 * - block sizing defaults if you want (but recipes mostly control blocks now)
	 */
	schedule?: Partial<ScheduleOptions>;
};

export type DayProfileSettings = {
	enabled: boolean;

	/** Packs are reusable building blocks */
	packs: RecipePack[];

	/** Grand profiles pick packs + defaults */
	grandProfiles: GrandProfile[];

	/**
	 * Optional per-date override (we’ll wire later).
	 * Map YYYY-MM-DD -> grandProfileId
	 */
	manualByDate?: Record<string, string>;
};
