/**
 * adapters/obsidian/time-context.ts
 *
 * This file bridges the Obsidian runtime environment to the core TimeContext.
 *
 * The core must never read ambient time directly (no `new Date()` in src/core).
 * Instead, we build a TimeContext at the edge of the system and inject it into the
 * pipeline and any other policy that needs a notion of “now”.
 *
 * Intent:
 * - Keep the definition of “now” and “timezone” centralized and explicit.
 * - Avoid coupling the core to any particular date/time library.
 *
 * Notes:
 * - We do not rely on Obsidian APIs here. The host JS runtime already provides
 *   the standard clock and timezone resolution.
 */

import type { TimeContext } from "../../core/model/time";

/**
 * Build a TimeContext from the current runtime environment.
 *
 * Invariants:
 * - `now` is created exactly once here and treated as immutable input downstream.
 * - `tz` is best-effort. If the runtime cannot resolve an IANA zone, we omit it.
 */
export function buildTimeContext(): TimeContext {
	const now = new Date();

	// Best-effort timezone detection. This stays outside the core so policies can
	// decide what to do when tz is missing.
	let tz: string | undefined;
	try {
		tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		tz = undefined;
	}

	return tz ? { now, tz } : { now };
}
