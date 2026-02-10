/**
 * core/model/time.ts
 *
 * This file defines how the TaskX core becomes “aware of time”.
 *
 * Design goals:
 * - Keep time dependencies explicit and injectable.
 * - Avoid coupling the core to any specific date/time library (Moment, Day.js, Luxon, etc.).
 * - Make the pipeline deterministic and testable by passing "now" as data, not reading globals.
 *
 * Anything that needs to reason about:
 * - "what time is it now?"
 * - "what day is today?"
 * - "which planning windows are active?"
 * should depend on TimeContext, not on global clocks.
 */

/**
 * TimeContext represents the temporal context in which the pipeline runs.
 *
 * Notes:
 * - `now` is a Date object because it is the most neutral, standard representation in JS/TS.
 * - We do not store derived values here (like "today's date string") to avoid duplication
 *   and policy leakage; those should be computed where needed.
 * - `tz` (timezone) is optional because:
 *   - In many cases, the environment’s local timezone is sufficient.
 *   - Some future features (e.g., planning across timezones) may want to set it explicitly.
 */
export interface TimeContext {
	/**
	 * Current instant for this pipeline run.
	 *
	 * Important:
	 * - The pipeline must treat this as immutable input.
	 * - No code in the core should call `new Date()` directly; that belongs in adapters/entrypoints.
	 */
	now: Date;

	/**
	 * Optional IANA timezone identifier (e.g., "Europe/Paris").
	 *
	 * Notes:
	 * - This is advisory; not all policies will need it.
	 * - If undefined, consumers may assume the environment’s local timezone.
	 */
	tz?: string;
}
