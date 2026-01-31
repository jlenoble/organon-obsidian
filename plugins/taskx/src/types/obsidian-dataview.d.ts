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

	/** Values Dataview can render in tables/lists. */
	type RenderValue = Value | HTMLElement;

	type ArrayFunc<T, R> = (elem: T, index: number, arr: T[]) => R;
	type Predicate<T> = ArrayFunc<T, boolean>;
	type ArrayComparator<T> = (a: T, b: T) => number;

	/** Dataview's chainable array type. */
	interface DataArray<T> extends Array<T> {
		where(predicate: (value: T, index: number, array: T[]) => boolean): DataArray<T>;
		map<U>(mapper: (value: T, index: number, array: T[]) => U): DataArray<U>;
		sort<U>(
			key: ArrayFunc<T, U>,
			direction?: "asc" | "desc",
			comparator?: ArrayComparator<U>,
		): DataArray<T>;

		/**
		 * Dataview-style field projection.
		 * Allows dv.pages().file to work as a projected column.
		 */
		readonly file: T extends DvPage ? DataArray<DvFile> : never;

		/**
		 * Dataview-style field projection.
		 * Allows dv.pages().file.tasks to work.
		 */
		readonly tasks: T extends DvFile ? DataArray<DvTask> : never;
	}

	/** What's between the brackets in a task */
	type DvTaskStatus = " " | "x" | "X";

	/** A Dataview task. */
	interface DvTask {
		task: true;
		status: DvTaskStatus;
		text: string;
		completed?: boolean;
		checked?: boolean; // some versions use checked
		line: number;
		path: string;
	}

	/** Dataview file metadata. */
	interface DvFile {
		path: string;
		name: string;
		tasks: DataArray<DvTask>;
	}

	/** Dataview page object. */
	interface DvPage {
		file: DvFile;
	}

	interface DataviewApi {
		/** Return all pages matching a query */
		pages(query?: string): DataArray<DvPage>;

		/** Return metadata for a page */
		page(path: string): DvPage | null;

		/** Evaluate a Dataview query expression */
		evaluate(expression: string, context?: unknown): Value;

		/** Return current page context */
		current(): DvPage | null;

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
		table(headers: string[] | undefined, rows: RenderValue[][] | Iterable<RenderValue[]>): void;

		/** Render a Markdown list from an array or iterable */
		list(items: Iterable<RenderValue>): void;

		/** Render a Markdown header */
		header(n: number, text: string): void;

		/** Render a Markdown paragraph */
		paragraph(text: string): void;

		/** Render a task list */
		taskList(tasks: Iterable<DvTask>, groupByFile?: boolean): void;

		/** Render an inline string */
		span(text: string): HTMLElement;

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
			content?: string,
			options?: {
				cls?: string | string[];
				attr?: Record<string, string>;
			},
		): HTMLElementTagNameMap[K];
	}
}
