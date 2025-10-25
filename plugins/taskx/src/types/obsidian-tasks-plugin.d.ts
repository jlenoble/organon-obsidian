type TaskDate = moment.Moment | null;

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

		/** The file path (relative to vault root) where the task resides. */
		path: string;

		/** ISO string or Date representing when the task was created. */
		createdDate: TaskDate;

		/** Due date, if any. */
		dueDate: TaskDate;

		/** Completion date, if any. */
		doneDate: TaskDate;

		/** Optional scheduled or start date. */
		scheduledDate: TaskDate;
		startDate: TaskDate;

		/** Any inline tags (e.g. #work #urgent). */
		tags: string[];
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
