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
		/** The line number where the task resides. */
		lineNumber: number;

		/** ISO string or Date representing when the task was created. */
		createdDate: TaskDate;
		/** Due date, if any. */
		dueDate: TaskDate;
		/** Completion date, if any. */
		doneDate: TaskDate;
		/** Optional scheduled or start date. */
		scheduledDate: TaskDate;
		startDate: TaskDate;

		//** Dependencies */
		dependsOn: string[];

		/** Any inline tags (e.g. #work #urgent). */
		tags: string[];

		/** Status oj the task */
		status: {
			isCompleted(): boolean;
		};
	}

	/** A query result as returned by the Tasks plugin API. */
	interface QueryResult {
		tasks: Task[];
		/** The raw query text, e.g. "not done due today". */
		queryText: string;
	}

	/** The public plugin API, exposed on window.tasksPlugin or via Dataview integration. */
	interface TasksApi {
		executeToggleTaskDoneCommand: (line: string, path: string) => string;
	}

	/** The public plugin, app.plugins.plugins["obsidian-tasks-plugin"] */
	interface TasksPlugin {
		apiV1: TasksApi;

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
