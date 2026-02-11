/**
 * entry/render.ts
 *
 * This file is the M0 entrypoint glue for rendering a TaskX feed.
 *
 * Responsibility:
 * - Build a TimeContext from the runtime environment (adapter boundary).
 * - Run the core pipeline to obtain a UI-ready RecommendationFeed.
 * - Render that feed into a plain HTMLElement subtree (UI boundary).
 *
 * Invariants:
 * - We do not implement feature logic or policy here. The pipeline decides.
 * - We do not attach elements to the DOM. Callers manage mounting/unmounting.
 *
 * Non-goals:
 * - Obsidian code block registration (plugin.ts owns that).
 * - Styling. We only pass through stable markup produced by the UI renderer.
 */

import { buildTimeContext } from "../adapters/obsidian/time-context";
import { runPipeline } from "../core/pipeline/pipeline";
import { renderFeed, type RenderFeedOptions } from "../ui/feed/render-feed";

/**
 * Options for the M0 entry renderer.
 *
 * Notes:
 * - These are UI-level toggles only. They must not affect pipeline decisions.
 */
export interface RenderTaskXOptions extends RenderFeedOptions {
	/**
	 * Override TimeContext construction.
	 *
	 * Rationale:
	 * - Tests can inject a fixed notion of "now".
	 * - The Obsidian entrypoint can later expose an advanced debugging hook.
	 */
	buildCtx?: () => ReturnType<typeof buildTimeContext>;
}

/**
 * Run the pipeline and return a rendered RecommendationFeed subtree.
 *
 * The returned element is not attached to the DOM. The caller decides where it
 * lives (code block container, view, modal, etc.).
 */
export function renderTaskX(opts: RenderTaskXOptions = {}): HTMLElement {
	const ctxBuilder = opts.buildCtx ?? buildTimeContext;
	const ctx = ctxBuilder();

	const feed = runPipeline({ ctx });
	return renderFeed(feed, opts);
}
