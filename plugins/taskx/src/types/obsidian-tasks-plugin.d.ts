/**
 * Minimal typings for the "obsidian-tasks-plugin".
 *
 * Note:
 *  - These declarations intentionally use `declare namespace` to avoid polluting global scope.
 *  - You can gradually replace `any` types as you explore the actual plugin internals.
 */

declare namespace ObsidianTasks {
	/** Represents a single task as managed by the Tasks plugin. */
	interface Task {
		/** The original markdown line representing the task. */
		originalMarkdown: string;

		/** The text of the task, without checkbox or metadata. */
		description: string;

		/** True if the task is marked as done (checked). */
		status: string;

		/** The file path (relative to vault root) where the task resides. */
		path: string;

		/** The line number in the file where this task is defined. */
		line: number;

		/** ISO string or Date representing when the task was created. */
		createdDate?: moment.Moment;

		/** Due date, if any. */
		dueDate?: moment.Moment;

		/** Completion date, if any. */
		doneDate?: moment.Moment;

		/** Optional scheduled or start date. */
		scheduledDate?: moment.Moment;
		startDate?: moment.Moment;

		/** Any inline tags (e.g. #work #urgent). */
		tags?: string[];

		/** Any block link or heading hierarchy info. */
		blockLink?: string;
		heading?: string;

		/** True if the task is hidden from standard query results. */
		hidden?: boolean;
	}

	/** A query result as returned by the Tasks plugin API. */
	interface QueryResult {
		tasks: Task[];
		/** The raw query text, e.g. "not done due today". */
		queryText: string;
	}

	/** The public plugin API, exposed on window.tasksPlugin or via Dataview integration. */
	interface TasksApi {
		/** Runs a Tasks-style query and returns matching tasks. */
		query(query: string): Promise<QueryResult>;

		/** Renders a task as markdown, including its checkbox. */
		renderTask(task: Task): string;

		/** Marks a task done/undone and updates the underlying file. */
		toggleDone(task: Task): Promise<void>;
	}

	/** The public plugin, app.plugins.plugins["obsidian-tasks-plugin"] */
	interface TasksPlugin {
		api: TasksApi;

		/** Parses all tasks from the vault or a single file. */
		getTasks(): Task[];
	}
}

/**
 * Global entry point (depending on Tasks version).
 * We access the plugin with:
 *   - app.plugins.plugins["obsidian-tasks-plugin"]
 */
declare global {
	namespace App {
		interface Plugins {
			["obsidian-tasks-plugin"]?: Partial<ObsidianTasks.TasksPlugin>;
		}
	}
}
