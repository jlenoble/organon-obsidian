/**
 * core/model/id.ts
 *
 * We centralize ID conventions here because IDs become the “spine” of the system:
 * tasks, issues, fixes, recommendations, templates, superblocks, etc.
 *
 * Design goals:
 * - Extensible: we avoid closed unions for kinds; new feature folders can introduce new IDs.
 * - Type-safe: we prevent mixing different IDs (e.g., using a TaskId where an IssueId is expected).
 * - Minimal: no hashing, no persistence, no heavy helpers yet—just the branded types and casts.
 *
 * Naming conventions (stable, never rename later):
 * - Stable IDs are kebab-case strings when they represent keys (e.g., "missing-duration").
 * - Composite IDs may use ":" as a namespace delimiter (e.g., "missing-duration:<taskId>").
 *
 * Note:
 * - Branding is compile-time only; at runtime all IDs are strings.
 * - We keep the “asXxxId” helpers tiny; more advanced ID generation belongs in util/id.ts later.
 */

/**
 * Generic brand helper.
 * We use a `readonly __brand` marker so different ID types are not assignable to each other.
 */
export type Brand<TBase, TBrand extends string> = TBase & {
	readonly __brand: TBrand;
};

/** Canonical task identifier (stable across pipeline stages). */
export type TaskId = Brand<string, "TaskId">;

/** Issue identifier (usually "issue-id:<taskId>" or "issue-id:global"). */
export type IssueId = Brand<string, "IssueId">;

/**
 * Fix recipe identifier (shared option key).
 * Examples:
 * - "fix:set-duration-15m"
 * - "fix:add-tag:#b5"
 *
 * Collisions are intended: the same fix recipe can be proposed for many tasks/issues.
 */
export type FixId = Brand<string, "FixId">;

/**
 * Fix candidate identifier (unique instance key for UI/actions).
 * Examples:
 * - "fixcand:missing-duration:<taskId>:fix:set-duration-15m"
 *
 * This must be unique per rendered candidate, even when recipeId repeats.
 */
export type FixCandidateId = Brand<string, "FixCandidateId">;

/** Recommendation identifier (stable key for a recommendation item in the feed). */
export type RecommendationId = Brand<string, "RecommendationId">;

/**
 * Cast helper.
 *
 * It is intentionally “dumb”: It does not validate format.
 * Validation (if desired) should be layered elsewhere, because:
 * - Some IDs are composite (":" namespaces).
 * - Some IDs may be produced by hashing later.
 * - We do not want to lock ourselves into one rigid format.
 */
export function asTaskId(raw: string): TaskId {
	return raw as TaskId;
}

/**
 * Cast helper.
 *
 * It is intentionally “dumb”: It does not validate format.
 * Validation (if desired) should be layered elsewhere, because:
 * - Some IDs are composite (":" namespaces).
 * - Some IDs may be produced by hashing later.
 * - We do not want to lock ourselves into one rigid format.
 */
export function asIssueId(raw: string): IssueId {
	return raw as IssueId;
}

/**
 * Cast helper.
 *
 * It is intentionally “dumb”: It does not validate format.
 * Validation (if desired) should be layered elsewhere, because:
 * - Some IDs are composite (":" namespaces).
 * - Some IDs may be produced by hashing later.
 * - We do not want to lock ourselves into one rigid format.
 */
export function asFixId(raw: string): FixId {
	return raw as FixId;
}

/**
 * Cast helper.
 *
 * It is intentionally “dumb”: It does not validate format.
 * Validation (if desired) should be layered elsewhere, because:
 * - Some IDs are composite (":" namespaces).
 * - Some IDs may be produced by hashing later.
 * - We do not want to lock ourselves into one rigid format.
 */
export function asFixCandidateId(raw: string): FixCandidateId {
	return raw as FixCandidateId;
}

/**
 * Cast helper.
 *
 * It is intentionally “dumb”: It does not validate format.
 * Validation (if desired) should be layered elsewhere, because:
 * - Some IDs are composite (":" namespaces).
 * - Some IDs may be produced by hashing later.
 * - We do not want to lock ourselves into one rigid format.
 */
export function asRecommendationId(raw: string): RecommendationId {
	return raw as RecommendationId;
}
