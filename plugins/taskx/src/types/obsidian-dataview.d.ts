import "obsidian-dataview";

declare module "obsidian-dataview" {
	/** Minimal scalar-ish value used by Dataview. */
	type Value =
		| string
		| number
		| boolean
		| null
		| undefined
		| Date
		| Value[]
		| { [key: string]: Value };

	interface DataviewApi {
		/** Return all pages matching a query */
		pages(query?: string): Value[];

		/** Return metadata for a page */
		page(path: string): Record<string, Value> | null;

		/** Evaluate a Dataview query expression */
		evaluate(expression: string, context?: unknown): Value;

		/** Return current page context */
		current(): Record<string, Value> | null;

		/** Convert path or link to a Dataview link */
		fileLink(path: string): unknown;

		/** Execute a Dataview query directly */
		query(query: string): Promise<Value>;
	}

	/**
	 * Inline Dataview API — available in inline JS queries via the global `dv` object.
	 * It provides rendering helpers and basic query access.
	 */
	interface DataviewInlineApi extends DataviewApi {
		/** Render a Markdown table with optional headers */
		table(headers: string[] | undefined, rows: Value[][] | Iterable<Value[]>): void;

		/** Render a Markdown list from an array or iterable */
		list(items: Iterable<string | number | boolean | Record<string, Value>>): void;

		/** Render a Markdown paragraph */
		paragraph(text: string): void;

		/** Render a task list */
		taskList(tasks: Iterable<Record<string, Value>>, groupByFile?: boolean): void;

		/**
		 * Render an arbitrary HTML element inside the current Dataview block.
		 * Returns the created HTMLElement.
		 *
		 * @param tag HTML tag name (e.g., 'div', 'span')
		 * @param options Optional attributes or class list
		 * @param content Optional initial text content
		 */
		el<K extends keyof HTMLElementTagNameMap>(
			tag: K,
			options?: {
				cls?: string | string[];
				attr?: Record<string, string>;
			},
			content?: string,
		): HTMLElementTagNameMap[K];
	}
}
