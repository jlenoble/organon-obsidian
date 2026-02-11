/**
 * main.ts
 *
 * This file is the build and Obsidian entrypoint.
 *
 * Responsibility:
 * - Re-export the plugin class as the default export.
 *
 * Rationale:
 * - Obsidian and our build chain expect a `main.ts` file that exports the plugin
 *   class as default.
 * - We keep `plugin.ts` as the real implementation file to preserve clear
 *   responsibilities and avoid overloading this entrypoint with logic.
 *
 * Invariants:
 * - This file must remain a thin wiring layer.
 * - No policy, no UI logic, and no side effects belong here.
 *
 * Non-goals:
 * - Duplicating plugin logic.
 * - Introducing any additional initialization behavior.
 */

export { default } from "./plugin";
