import { DEFAULT_DAY_PROFILE_SETTINGS } from "./profile-defaults";
import type { DayProfileSettings, GrandProfile, RecipePack, BlockRecipe } from "./profile-types";

export type LoadedDayProfiles = {
	settings: DayProfileSettings;
	diagnostics: string[];
};

export function isRecord(x: unknown): x is Record<string, unknown> {
	return typeof x === "object" && x !== null;
}

export function asString(x: unknown): string | null {
	return typeof x === "string" ? x : null;
}

export function asBool(x: unknown): boolean | null {
	return typeof x === "boolean" ? x : null;
}

export function asNumber(x: unknown): number | null {
	return typeof x === "number" && Number.isFinite(x) ? x : null;
}

export function clampInt(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function parseWhen(raw: unknown): BlockRecipe["when"] | undefined {
	if (!isRecord(raw)) {
		return undefined;
	}
	const kind = asString(raw.kind);
	if (!kind) {
		return undefined;
	}

	if (kind === "always") {
		return { kind: "always" };
	}

	if (kind === "weekday") {
		const days = Array.isArray(raw.days)
			? raw.days.map(asNumber).filter((n): n is number => n !== null)
			: [];
		return { kind: "weekday", days: days.map(d => clampInt(d, 0, 6)) };
	}

	if (kind === "weekend") {
		return { kind: "weekend" };
	}

	if (kind === "dateRange") {
		const startISO = asString(raw.startISO);
		const endISO = asString(raw.endISO);
		if (!startISO || !endISO) {
			return undefined;
		}
		return { kind: "dateRange", startISO, endISO };
	}

	return undefined;
}

export function normalizeRecipe(raw: unknown, diags: string[], idx: number): BlockRecipe | null {
	if (!isRecord(raw)) {
		diags.push(`❌ recipe[${idx}] is not an object → skipped`);
		return null;
	}

	const id = asString(raw.id);
	if (!id) {
		diags.push(`❌ recipe[${idx}] missing id → skipped`);
		return null;
	}

	const label = asString(raw.label) ?? id;

	// window
	const w = raw.window;
	if (!isRecord(w)) {
		diags.push(`❌ recipe "${id}" missing window → skipped`);
		return null;
	}
	const start = asString(w.start);
	const end = asString(w.end);
	if (!start || !end) {
		diags.push(`❌ recipe "${id}" window.start/window.end invalid → skipped`);
		return null;
	}

	// kind
	const kind = asString(raw.kind) as BlockRecipe["kind"] | null;
	if (!kind) {
		diags.push(`❌ recipe "${id}" missing kind → skipped`);
		return null;
	}

	// profile
	const profileRaw = raw.profile;
	if (!isRecord(profileRaw) || asString(profileRaw.mode) === null) {
		diags.push(`❌ recipe "${id}" missing profile.mode → skipped`);
		return null;
	}
	const mode = asString(profileRaw.mode);
	if (mode !== "deep" && mode !== "shallow" && mode !== "admin") {
		diags.push(`❌ recipe "${id}" invalid profile.mode="${String(mode)}" → skipped`);
		return null;
	}
	const profile = { mode } as BlockRecipe["profile"];

	// chunkMinutes
	const chunk = asNumber(raw.chunkMinutes);
	if (chunk === null || chunk <= 0) {
		diags.push(`❌ recipe "${id}" chunkMinutes must be > 0 → skipped`);
		return null;
	}
	const chunkMinutes = clampInt(chunk, 5, 240);

	// Optional gates
	const allowAuthority = asBool(raw.allowAuthority) ?? mode === "admin"; // sensible default
	const priority = asNumber(raw.priority) ?? 9999;

	const minUrgency = asString(raw.minUrgency) as BlockRecipe["minUrgency"] | null;
	const minUrgencyOk =
		minUrgency === null ||
		minUrgency === "low" ||
		minUrgency === "medium" ||
		minUrgency === "high" ||
		minUrgency === "critical";

	const maxTasks = asNumber(raw.maxTasks);
	const maxTasksNorm = maxTasks === null ? undefined : clampInt(maxTasks, 0, 99);

	const when = parseWhen(raw.when);

	if (!minUrgencyOk) {
		diags.push(`⚠ recipe "${id}" invalid minUrgency → ignored`);
	}

	return {
		id,
		label,
		window: { start, end },
		kind,
		profile,
		chunkMinutes,
		allowAuthority,
		minUrgency: minUrgencyOk ? (minUrgency ?? undefined) : undefined,
		maxTasks: maxTasksNorm,
		when,
		priority,
	};
}

export function normalizePack(raw: unknown, diags: string[], idx: number): RecipePack | null {
	if (!isRecord(raw)) {
		diags.push(`❌ pack[${idx}] is not an object → skipped`);
		return null;
	}
	const id = asString(raw.id);
	if (!id) {
		diags.push(`❌ pack[${idx}] missing id → skipped`);
		return null;
	}
	const label = asString(raw.label) ?? id;

	const recipesRaw = raw.recipes;
	if (!Array.isArray(recipesRaw)) {
		diags.push(`❌ pack "${id}" missing recipes[] → skipped`);
		return null;
	}

	const recipes: BlockRecipe[] = [];
	for (let i = 0; i < recipesRaw.length; i++) {
		const r = normalizeRecipe(recipesRaw[i], diags, i);
		if (r) {
			recipes.push(r);
		}
	}

	return { id, label, recipes };
}

export function normalizeGrandProfile(
	raw: unknown,
	diags: string[],
	idx: number,
): GrandProfile | null {
	if (!isRecord(raw)) {
		diags.push(`❌ grandProfile[${idx}] is not an object → skipped`);
		return null;
	}

	const id = asString(raw.id);
	if (!id) {
		diags.push(`❌ grandProfile[${idx}] missing id → skipped`);
		return null;
	}

	const label = asString(raw.label) ?? id;
	const priority = asNumber(raw.priority) ?? 1000;

	const packIdsRaw = raw.packIds;
	const packIds = Array.isArray(packIdsRaw)
		? packIdsRaw.map(asString).filter((s): s is string => !!s)
		: [];

	const selectorsRaw = raw.selectors;
	const selectors: GrandProfile["selectors"] = [];

	if (Array.isArray(selectorsRaw)) {
		for (const s of selectorsRaw) {
			if (!isRecord(s)) {
				continue;
			}
			const k = asString(s.kind);
			if (!k) {
				continue;
			}
			if (k === "weekday") {
				selectors.push({ kind: "weekday" });
			} else if (k === "weekend") {
				selectors.push({ kind: "weekend" });
			} else if (k === "dateRange") {
				const startISO = asString(s.startISO);
				const endISO = asString(s.endISO);
				if (startISO && endISO) {
					selectors.push({ kind: "dateRange", startISO, endISO });
				}
			}
			// "manual" selector omitted on purpose in v1 (reserved)
		}
	}

	// schedule overrides are v1 “pass-through”: we keep them as-is if present,
	// but we do not validate deeply yet (we can later).
	const schedule = isRecord(raw.schedule) ? raw.schedule : undefined;

	return {
		id,
		label,
		priority,
		selectors: selectors.length ? selectors : [{ kind: "weekday" }], // safe default
		packIds,
		schedule,
	};
}

/**
 * Load and sanitize day profiles config from plugin settings.
 *
 * v1 policy:
 * - If missing/invalid → fallback to DEFAULT_DAY_PROFILE_SETTINGS
 * - Always return diagnostics (never throw)
 * - Enforce basic integrity: unique ids + valid references
 */
export function loadDayProfilesConfig(args: {
	raw: unknown; // e.g. options.settings.dayProfiles
	defaults?: DayProfileSettings;
}): LoadedDayProfiles {
	const diags: string[] = [];
	const defaults = args.defaults ?? DEFAULT_DAY_PROFILE_SETTINGS;

	if (!args.raw) {
		diags.push("ℹ dayProfiles missing → using defaults");
		return { settings: defaults, diagnostics: diags };
	}

	if (!isRecord(args.raw)) {
		diags.push("❌ dayProfiles is not an object → using defaults");
		return { settings: defaults, diagnostics: diags };
	}

	const enabled = asBool(args.raw.enabled) ?? true;

	// Packs
	const packsRaw = args.raw.packs;
	const packs: RecipePack[] = [];
	if (Array.isArray(packsRaw)) {
		for (let i = 0; i < packsRaw.length; i++) {
			const p = normalizePack(packsRaw[i], diags, i);
			if (p) {
				packs.push(p);
			}
		}
	} else {
		diags.push("⚠ dayProfiles.packs missing/invalid → using defaults packs");
		packs.push(...defaults.packs);
	}

	// Grand profiles
	const gpRaw = args.raw.grandProfiles;
	const grandProfiles: GrandProfile[] = [];
	if (Array.isArray(gpRaw)) {
		for (let i = 0; i < gpRaw.length; i++) {
			const g = normalizeGrandProfile(gpRaw[i], diags, i);
			if (g) {
				grandProfiles.push(g);
			}
		}
	} else {
		diags.push("⚠ dayProfiles.grandProfiles missing/invalid → using defaults grandProfiles");
		grandProfiles.push(...defaults.grandProfiles);
	}

	// manualByDate
	const manualByDate = isRecord(args.raw.manualByDate)
		? (args.raw.manualByDate as Record<string, string>)
		: undefined;

	// --- Integrity checks ----------------------------------------------------

	// Unique pack ids
	{
		const seen = new Set<string>();
		const out: RecipePack[] = [];
		for (const p of packs) {
			if (seen.has(p.id)) {
				diags.push(`❌ duplicate pack id "${p.id}" → later one dropped`);
				continue;
			}
			seen.add(p.id);
			out.push(p);
		}
		packs.length = 0;
		packs.push(...out);
	}

	// Unique grand profile ids
	{
		const seen = new Set<string>();
		const out: GrandProfile[] = [];
		for (const g of grandProfiles) {
			if (seen.has(g.id)) {
				diags.push(`❌ duplicate grandProfile id "${g.id}" → later one dropped`);
				continue;
			}
			seen.add(g.id);
			out.push(g);
		}
		grandProfiles.length = 0;
		grandProfiles.push(...out);
	}

	// Validate pack references
	{
		const packIds = new Set(packs.map(p => p.id));
		for (const g of grandProfiles) {
			const missing = g.packIds.filter(id => !packIds.has(id));
			if (missing.length) {
				diags.push(`❌ grandProfile "${g.id}" references missing packIds: ${missing.join(", ")}`);
				// Keep it but it will produce fewer blocks; that’s fine for v1.
			}
		}
	}

	// If we ended up empty, fall back
	if (!packs.length || !grandProfiles.length) {
		diags.push("❌ dayProfiles ended up empty after normalization → using defaults");
		return { settings: defaults, diagnostics: diags };
	}

	return {
		settings: { enabled, packs, grandProfiles, manualByDate },
		diagnostics: diags,
	};
}
