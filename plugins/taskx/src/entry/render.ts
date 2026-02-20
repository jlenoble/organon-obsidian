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
 * - We do not implement feature logic, ranking policy, or recommendation policy here.
 * - Entry-level visibility defaults may be applied, but they must not re-rank or
 *   reinterpret pipeline decisions.
 * - We do not attach elements to the DOM. Callers manage mounting/unmounting.
 *
 * Non-goals:
 * - Obsidian code block registration (plugin.ts owns that).
 * - Styling. We only pass through stable markup produced by the UI renderer.
 */

import type { App } from "obsidian";

import { collectTasksFromDataview } from "@/adapters/obsidian/collect-tasks";
import { writeDebugFeedMirror } from "@/adapters/obsidian/debug-feed-mirror";
import { loadTaskXLocalDebugConfig } from "@/adapters/obsidian/local-debug-config";
import { buildTimeContext } from "@/adapters/obsidian/time-context";
import type { RecommendationFeed } from "@/core/model/recommendation";
import type { TaskEntity } from "@/core/model/task";
import { runPipeline } from "@/core/pipeline/pipeline";
import {
	DEFAULT_COLLECTED_VISIBILITY_MODE,
	DEFAULT_DEBUG_FEED_MIRROR_PATH,
	DEFAULT_DEBUG_SUBSET_TAG,
	DEFAULT_ENABLE_DEBUG_FEED_MIRROR,
	DEFAULT_ENABLE_DEBUG_SUBSET_MODE,
	DEFAULT_SHOW_IDS,
	DEFAULT_SHOW_PROVENANCE_LINKS,
	type CollectedVisibilityMode,
} from "@/entry/render-defaults";
import { renderFeed, type RenderFeedOptions } from "@/ui/feed/render-feed";

/**
 * Options for the entry renderer.
 *
 * Notes:
 * - These are UI-level toggles only. They must not affect pipeline decisions.
 * - `app` is required to access Obsidian runtime facilities (plugins, vault).
 */
export interface RenderTaskXOptions extends RenderFeedOptions {
	/** Obsidian runtime app handle used by entry adapters and collectors. */
	app: App;

	/** UI-only visibility mode for the Collected section at render time. */
	collectedVisibility?: CollectedVisibilityMode;

	/** Enable dev-only debug mirroring of rendered feed output to a local file. */
	enableDebugFeedMirror?: boolean;

	/** Target path for debug feed mirror output when mirroring is enabled. */
	debugFeedMirrorPath?: string;

	/** Enable dev-only debug subset mode for tagged task focus. */
	enableDebugSubsetMode?: boolean;

	/** Canonical tag token used to select debug subset tasks (without `#`). */
	debugSubsetTag?: string;

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
	const localDebugConfig = await loadTaskXLocalDebugConfig(opts.app);

	const feed = await runPipeline({ ctx, collect });
	const visibleFeed = applyCollectedVisibility(feed, opts.collectedVisibility);
	const enableDebugFeedMirror =
		opts.enableDebugFeedMirror ??
		localDebugConfig?.enableDebugFeedMirror ??
		DEFAULT_ENABLE_DEBUG_FEED_MIRROR;
	const debugFeedMirrorPath =
		opts.debugFeedMirrorPath ??
		localDebugConfig?.debugFeedMirrorPath ??
		DEFAULT_DEBUG_FEED_MIRROR_PATH;
	const localDebugSubsetConfig = localDebugConfig as {
		enableDebugSubsetMode?: boolean;
		debugSubsetTag?: string;
	} | null;
	const enableDebugSubsetMode =
		opts.enableDebugSubsetMode ??
		localDebugSubsetConfig?.enableDebugSubsetMode ??
		DEFAULT_ENABLE_DEBUG_SUBSET_MODE;
	const debugSubsetTag =
		opts.debugSubsetTag ?? localDebugSubsetConfig?.debugSubsetTag ?? DEFAULT_DEBUG_SUBSET_TAG;
	// M1.4c-T2 entry wiring: values are resolved here and consumed by stage-collect
	// once filtering logic is introduced in M1.4c-T3.
	void enableDebugSubsetMode;
	void debugSubsetTag;
	const rendered = renderFeed(visibleFeed, {
		...opts,
		showIds: opts.showIds ?? DEFAULT_SHOW_IDS,
		showProvenanceLinks: opts.showProvenanceLinks ?? DEFAULT_SHOW_PROVENANCE_LINKS,
	});

	await maybeMirrorFeedDebugOutput({
		enabled: enableDebugFeedMirror,
		path: debugFeedMirrorPath,
		app: opts.app,
		rendered,
	});

	return rendered;
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

function applyCollectedVisibility(
	feed: RecommendationFeed,
	mode: CollectedVisibilityMode = DEFAULT_COLLECTED_VISIBILITY_MODE,
): RecommendationFeed {
	if (mode === "always") {
		return feed;
	}

	const hasActionableSection = feed.sections.some(
		section => section.title === "Do now" || section.title === "Unblock",
	);

	if (mode === "never" || (mode === "auto" && hasActionableSection)) {
		return {
			sections: feed.sections.filter(section => section.title !== "Collected"),
		};
	}

	return feed;
}

/**
 * Entry-level seam for debug feed mirroring.
 *
 * Entry resolves mirror policy and delegates best-effort persistence to the
 * Obsidian adapter boundary.
 *
 * Notes:
 * - This seam must not affect pipeline ranking or recommendation semantics.
 * - Mirror write failures must never block rendering.
 */
async function maybeMirrorFeedDebugOutput(params: {
	enabled: boolean;
	path: string;
	app: App;
	rendered: HTMLElement;
}): Promise<void> {
	if (!params.enabled) {
		return;
	}

	await writeDebugFeedMirror({
		app: params.app,
		path: params.path,
		content: serializeDebugMirrorContent(params.rendered),
	});
}

function serializeDebugMirrorContent(root: HTMLElement): string {
	return root.outerHTML;
}
