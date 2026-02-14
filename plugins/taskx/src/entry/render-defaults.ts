/**
 * entry/render-defaults.ts
 *
 * This file defines default display-policy values for TaskX rendering at the
 * entry boundary. It exists as a settings-ready seam: for now we use static
 * defaults, and later plugin settings can override these values without
 * changing pipeline or renderer contracts.
 *
 * Intent:
 * - Centralize UI visibility defaults in one explicit place.
 * - Keep ranking policy (core) separate from display toggles (entry/UI).
 *
 * Non-goals:
 * - No Obsidian settings storage here yet.
 * - No ranking or recommendation policy changes.
 */

/**
 * How the Collected section should be shown at render time.
 *
 * - "auto": show only when no actionable sections are present.
 * - "always": always show the section when available.
 * - "never": hide the section.
 */
export type CollectedVisibilityMode = "auto" | "always" | "never";

/** Default behavior for Collected visibility in the current UX policy. */
export const DEFAULT_COLLECTED_VISIBILITY_MODE: CollectedVisibilityMode = "auto";

/** Default diagnostics visibility for recommendation/task ids. */
export const DEFAULT_SHOW_IDS = false;

/** Default provenance-link visibility for task summaries. */
export const DEFAULT_SHOW_PROVENANCE_LINKS = true;
