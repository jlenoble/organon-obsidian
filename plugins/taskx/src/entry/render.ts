/**
 * entry/render.ts
 *
 * This file is the entrypoint glue for rendering a TaskX feed in Obsidian.
 *
 * Responsibility:
 * - Build a TimeContext from the runtime environment (adapter boundary).
 * - Choose a task collection strategy (adapter boundary).
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

import type { App } from "obsidian";

import { collectTasksFromDataview } from "../adapters/obsidian/collect-tasks";
import { buildTimeContext } from "../adapters/obsidian/time-context";
import type { TaskEntity } from "../core/model/task";
import { runPipeline } from "../core/pipeline/pipeline";
import { renderFeed, type RenderFeedOptions } from "../ui/feed/render-feed";

/**
 * Options for the entry renderer.
 *
 * Notes:
 * - These are UI-level toggles only. They must not affect pipeline decisions.
 * - `app` is required to access Obsidian runtime facilities (plugins, vault).
 */
export interface RenderTaskXOptions extends RenderFeedOptions {
	app: App;

	/**
	 * Override TimeContext construction.
	 *
	 * Rationale:
	 * - Tests can inject a fixed notion of "now".
	 * - The Obsidian entrypoint can later expose an advanced debugging hook.
	 */
	buildCtx?: () => ReturnType<typeof buildTimeContext>;

	/**
	 * Override task collection.
	 *
	 * Rationale:
	 * - Tests can inject fixtures.
	 * - Future adapters can replace Dataview collection without changing the
	 *   pipeline signature.
	 */
	collect?: () => Promise<TaskEntity[]>;
}

/**
 * Run the pipeline and return a rendered RecommendationFeed subtree.
 *
 * The returned element is not attached to the DOM. The caller decides where it
 * lives (code block container, view, modal, etc.).
 */
export async function renderTaskX(opts: RenderTaskXOptions): Promise<HTMLElement> {
	const ctxBuilder = opts.buildCtx ?? buildTimeContext;
	const ctx = ctxBuilder();

	const collect = opts.collect ?? buildDefaultCollector(opts.app);

	const feed = await runPipeline({ ctx, collect });
	return renderFeed(feed, opts);
}

/**
 * Build the default collector for the Obsidian runtime.
 *
 * We prefer Dataview when available. If Dataview is not installed or not
 * accessible, we return an empty list. This keeps the entrypoint robust and
 * allows the UI and pipeline to remain functional even without adapters.
 */
function buildDefaultCollector(app: App): () => Promise<TaskEntity[]> {
	return async () => {
		const dv = getDataviewApi(app);
		if (!dv) {
			return [];
		}

		return collectTasksFromDataview({ app, dataviewApi: dv });
	};
}

/**
 * Retrieve the Dataview API from the Obsidian plugin registry.
 *
 * Notes:
 * - We intentionally avoid importing Dataview types here.
 * - This is a best-effort lookup and may return null if Dataview is absent.
 */
function getDataviewApi(app?: App): unknown | null {
	const anyApp = app as
		| (App & {
				plugins?: {
					plugins?: Record<string, unknown>;
				};
		  })
		| undefined;

	const plugins = anyApp?.plugins?.plugins ?? null;
	const dv = (plugins?.["dataview"] as { api?: unknown } | undefined) ?? null;

	return dv?.api ?? null;
}
