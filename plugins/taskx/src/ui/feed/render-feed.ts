/**
 * ui/feed/render-feed.ts
 *
 * This file renders the core's RecommendationFeed into a plain HTMLElement tree.
 *
 * The feed is already grouped and ordered by the pipeline. Our intent here is to
 * provide a minimal, readable view with zero additional policy. This renderer is
 * deliberately "dumb": it does not re-rank, regroup, or infer meaning beyond the
 * discriminated union shape.
 *
 * Intent:
 * - Offer a stable rendering target for the M0 vertical slice.
 * - Extend rendering minimally as new recommendation kinds appear.
 *
 * Limits:
 * - We do not apply fixes, mutate notes, or call Obsidian APIs from this file.
 * - We keep interaction hooks future-facing, not feature-complete.
 *
 * Non-goals:
 * - Styling polish. We only attach predictable class names and data attributes.
 * - Any decision logic. Grouping, ordering, and policy belong to the pipeline.
 */

import type { Recommendation, RecommendationFeed } from "@/core/model/recommendation";

/**
 * Optional knobs for renderFeed.
 *
 * These are UI-only toggles. They must not affect ordering or grouping semantics.
 */
export interface RenderFeedOptions {
	/**
	 * Document used to create DOM nodes.
	 *
	 * Notes:
	 * - We default to the global document (Obsidian/Electron runtime).
	 * - Tests can pass a JSDOM document.
	 */
	doc?: Document;

	/**
	 * Whether to show score diagnostics for each recommendation.
	 *
	 * This is useful during early development, but we keep it off by default
	 * to avoid turning the UI into a policy surface.
	 */
	showScores?: boolean;

	/**
	 * Whether to show internal ids as small diagnostics.
	 *
	 * Rationale:
	 * - ids help validate stable rendering and future click wiring.
	 * - we keep them optional to avoid clutter for normal usage.
	 */
	showIds?: boolean;

	/**
	 * Whether to append a provenance link for each rendered task summary.
	 *
	 * When enabled and TaskSummary.origin.path is available, we append a wiki-link
	 * shaped label at the end of the task text (e.g. `[[folder/note|note]]`).
	 *
	 * Notes:
	 * - This is a rendering convenience only; it must not affect grouping policy.
	 * - We do not attempt to "jump to line" here. That is an interaction concern
	 *   handled in a later step (best-effort).
	 */
	showProvenanceLinks?: boolean;
}

/**
 * Render a RecommendationFeed as a self-contained HTMLElement subtree.
 *
 * Notes:
 * - This function is pure with respect to the feed: it does not mutate inputs.
 * - Returned nodes are not attached to the document; callers decide placement.
 * - The returned root has stable class names for styling and test selection.
 */
export function renderFeed(feed: RecommendationFeed, opts: RenderFeedOptions = {}): HTMLElement {
	const doc = opts.doc ?? document;

	const root = el(doc, "div", { className: "taskx-feed" });

	// An empty feed is a valid outcome. We render a short, non-error placeholder.
	if (feed.sections.length === 0) {
		root.append(el(doc, "div", { className: "taskx-feed__empty", text: "No recommendations." }));
		return root;
	}

	for (const section of feed.sections) {
		const sectionEl = el(doc, "section", { className: "taskx-feed__section" });

		sectionEl.append(
			el(doc, "h3", { className: "taskx-feed__section-title", text: section.title }),
		);

		const list = el(doc, "ul", { className: "taskx-feed__items" });

		for (const rec of section.items) {
			list.append(renderRecommendation(doc, rec, opts));
		}

		sectionEl.append(list);
		root.append(sectionEl);
	}

	return root;
}

function renderRecommendation(
	doc: Document,
	rec: Recommendation,
	opts: RenderFeedOptions,
): HTMLLIElement {
	const item = el(doc, "li", {
		className: `taskx-rec taskx-rec__${rec.kind}`,
	}) as HTMLLIElement;

	// Stable hooks for later wiring without making DOM structure itself a contract.
	item.dataset.taskxKind = rec.kind;
	item.dataset.taskxId = rec.id;

	const header = el(doc, "div", { className: "taskx-rec__header" });
	header.append(el(doc, "div", { className: "taskx-rec__title", text: rec.title }));
	header.append(el(doc, "div", { className: "taskx-rec__kind", text: rec.kind }));

	if (opts.showIds) {
		header.append(el(doc, "code", { className: "taskx-rec__id", text: rec.id }));
	}

	if (opts.showScores) {
		const s = rec.score;
		header.append(
			el(doc, "span", {
				className: "taskx-rec__score",
				text: `U${s.urgency} F${s.friction} P${s.payoff}`,
			}),
		);
	}

	item.append(header);

	if (rec.why.length > 0) {
		const whyList = el(doc, "ul", { className: "taskx-rec__why" });
		for (const why of rec.why) {
			whyList.append(el(doc, "li", { text: why }));
		}
		item.append(whyList);
	}

	if (rec.signals && rec.signals.length > 0) {
		item.append(renderSignals(doc, rec.signals));
	}

	item.append(renderRecommendationDetails(doc, rec, opts));

	return item;
}

function renderRecommendationDetails(
	doc: Document,
	rec: Recommendation,
	opts: RenderFeedOptions,
): HTMLElement {
	const details = el(doc, "div", { className: "taskx-rec__details" });

	// We keep this switch small and explicit.
	switch (rec.kind) {
		case "collected": {
			const taskCount = rec.tasks.length;
			details.append(
				el(doc, "div", {
					className: "taskx-rec__summary",
					text: taskCount === 1 ? "1 collected task" : `${taskCount} collected tasks`,
				}),
			);

			if (taskCount > 0) {
				const tasks = el(doc, "ul", { className: "taskx-rec__tasks" });
				for (const t of rec.tasks) {
					const li = el(doc, "li", { className: "taskx-rec__task" });

					// The summary text is the default, human-readable surface.
					li.append(el(doc, "span", { className: "taskx-rec__task-text", text: t.text }));

					// Provenance links are opt-in to keep minimal renders uncluttered.
					if (opts.showProvenanceLinks !== false && t.origin?.path) {
						li.append(el(doc, "span", { className: "taskx-rec__task-gap", text: " " }));
						li.append(renderProvenanceLink(doc, t.origin.path, t.origin.line));
					}

					// Diagnostics are opt-in to avoid turning ids into a primary UI surface.
					if (opts.showIds) {
						li.append(el(doc, "code", { className: "taskx-rec__task-id", text: t.id }));
						if (t.origin) {
							const suffix = t.origin.line ? `:${t.origin.line}` : "";
							li.append(
								el(doc, "span", {
									className: "taskx-rec__task-origin",
									text: `${t.origin.path}${suffix}`,
								}),
							);
						}
					}

					tasks.append(li);
				}
				details.append(tasks);
			}
			break;
		}

		case "fix": {
			const fixCount = rec.fixes.length;
			details.append(
				el(doc, "div", {
					className: "taskx-rec__summary",
					text: fixCount === 1 ? "1 fix candidate" : `${fixCount} fix candidates`,
				}),
			);

			if (fixCount > 0) {
				const fixes = el(doc, "ul", { className: "taskx-rec__fixes" });
				for (const f of rec.fixes) {
					const li = el(doc, "li", { className: "taskx-rec__fix" });
					li.append(el(doc, "span", { className: "taskx-rec__fix-label", text: f.label }));
					li.append(
						el(doc, "span", {
							className: "taskx-rec__fix-meta",
							text: `(${f.impact}, conf=${f.confidence})`,
						}),
					);
					fixes.append(li);
				}
				details.append(fixes);
			}

			const taskCount = rec.tasks.length;
			if (taskCount > 0) {
				// Fix recommendations now carry target TaskSummary values so users can
				// inspect what the fix applies to using the same text/provenance pattern
				// as collected and do-now task lists.
				details.append(
					el(doc, "div", {
						className: "taskx-rec__summary",
						text: taskCount === 1 ? "1 related task" : `${taskCount} related tasks`,
					}),
				);

				const tasks = el(doc, "ul", { className: "taskx-rec__tasks" });
				for (const t of rec.tasks) {
					const li = el(doc, "li", { className: "taskx-rec__task" });
					li.append(el(doc, "span", { className: "taskx-rec__task-text", text: t.text }));

					if (opts.showProvenanceLinks !== false && t.origin?.path) {
						li.append(el(doc, "span", { className: "taskx-rec__task-gap", text: " " }));
						li.append(renderProvenanceLink(doc, t.origin.path, t.origin.line));
					}

					if (opts.showIds) {
						li.append(el(doc, "code", { className: "taskx-rec__task-id", text: t.id }));
						if (t.origin) {
							const suffix = t.origin.line ? `:${t.origin.line}` : "";
							li.append(
								el(doc, "span", {
									className: "taskx-rec__task-origin",
									text: `${t.origin.path}${suffix}`,
								}),
							);
						}
					}

					tasks.append(li);
				}
				details.append(tasks);
			}
			break;
		}

		case "do-now": {
			const taskCount = rec.tasks.length;
			details.append(
				el(doc, "div", {
					className: "taskx-rec__summary",
					text: taskCount === 1 ? "1 task to do now" : `${taskCount} tasks to do now`,
				}),
			);

			if (taskCount > 0) {
				const tasks = el(doc, "ul", { className: "taskx-rec__tasks" });
				for (const t of rec.tasks) {
					const li = el(doc, "li", { className: "taskx-rec__task" });

					li.append(el(doc, "span", { className: "taskx-rec__task-text", text: t.text }));

					if (opts.showProvenanceLinks !== false && t.origin?.path) {
						li.append(el(doc, "span", { className: "taskx-rec__task-gap", text: " " }));
						li.append(renderProvenanceLink(doc, t.origin.path, t.origin.line));
					}

					if (opts.showIds) {
						li.append(el(doc, "code", { className: "taskx-rec__task-id", text: t.id }));
						if (t.origin) {
							const suffix = t.origin.line ? `:${t.origin.line}` : "";
							li.append(
								el(doc, "span", {
									className: "taskx-rec__task-origin",
									text: `${t.origin.path}${suffix}`,
								}),
							);
						}
					}

					tasks.append(li);
				}
				details.append(tasks);
			}
			break;
		}

		default: {
			// This should be unreachable because RecommendationKind is closed.
			// We keep a fallback so rendering degrades gracefully during refactors.

			// This turns “forgot to update the UI” into a compile-time failure instead of a silent bug
			// as Typescript will complain if we add a new kind without updating this switch.
			const _exhaustive: never = rec;
			// We don't want this variable to be flagged as never used, so we make it explicit that
			// this variable exists only for type-checking, not for runtime logic.
			void _exhaustive;

			details.append(el(doc, "div", { text: "Unsupported recommendation kind." }));
		}
	}

	return details;
}

function renderSignals(
	doc: Document,
	signals: NonNullable<Recommendation["signals"]>,
): HTMLElement {
	const list = el(doc, "ul", { className: "taskx-rec__signals" });

	for (const signal of signals) {
		const badge = el(doc, "li", {
			className: "taskx-rec__signal",
			text: signal.label,
		});
		badge.dataset.taskxSignalId = signal.id;
		list.append(badge);
	}

	return list;
}

/**
 * Render a provenance link in a way that remains useful in both Obsidian and tests.
 *
 * We keep the *label* wiki-link shaped to match user expectation (`[[path|name]]`),
 * but we also add Obsidian's conventional `internal-link` class + `data-href` so
 * Obsidian can attach its own click handling when available.
 */
function renderProvenanceLink(doc: Document, path: string, line?: number): HTMLAnchorElement {
	const { target, label } = normalizeProvenance(path);

	const a = doc.createElement("a");
	a.className = "taskx-rec__task-link internal-link";

	// We render the contracted label directly.
	//
	// Rationale:
	// - Obsidian contracts `[[target|label]]` when it parses Markdown.
	// - Here we build DOM nodes directly (no Markdown parsing step), so we must
	//   render the contracted label ourselves.
	a.textContent = label;

	// Best-effort internal-link semantics (Obsidian commonly uses data-href).
	a.dataset.href = target;
	a.href = target;

	// Keep the full wiki-link shape as metadata for debugging / copyability.
	a.dataset.taskxWiki = `[[${target}|${label}]]`;

	// Future-facing diagnostics/hooks (pure data; no interaction here yet).
	a.dataset.taskxOriginPath = path;
	if (line !== undefined) {
		a.dataset.taskxOriginLine = String(line);
	}

	return a;
}

function normalizeProvenance(path: string): { target: string; label: string } {
	// We normalize in a string-only way to stay runtime-agnostic (no node path utils).
	const trimmed = path.trim();

	// Obsidian internal link targets are typically extensionless.
	const target = trimmed.endsWith(".md") ? trimmed.slice(0, -3) : trimmed;

	// The label is the last path segment, also extensionless.
	const lastSlash = Math.max(target.lastIndexOf("/"), target.lastIndexOf("\\"));
	const base = lastSlash >= 0 ? target.slice(lastSlash + 1) : target;
	const label = base.length > 0 ? base : target;

	return { target, label };
}

type ElOptions = {
	className?: string;
	text?: string;
};

/**
 * Small helper to keep DOM creation explicit and consistent.
 *
 * Notes:
 * - We always use textContent, never innerHTML, to avoid accidental HTML injection.
 * - We keep attributes minimal to avoid making presentation details a contract.
 */
function el<K extends keyof HTMLElementTagNameMap>(
	doc: Document,
	tag: K,
	opts: ElOptions = {},
): HTMLElementTagNameMap[K] {
	const node = doc.createElement(tag);
	if (opts.className) {
		node.className = opts.className;
	}
	if (opts.text !== undefined) {
		node.textContent = opts.text;
	}
	return node;
}
