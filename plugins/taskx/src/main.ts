import { Plugin } from "obsidian";
import type { DataviewApi, DataviewInlineApi } from "obsidian-dataview";

type Task = ObsidianTasks.Task;
type TasksPlugin = ObsidianTasks.TasksPlugin;

export default class TaskXPlugin extends Plugin {
	dvApi: DataviewApi | null = null;
	tasksPlugin: TasksPlugin | null = null;

	#dv: DataviewInlineApi | null;
	get dv(): DataviewInlineApi | null {
		return this.#dv;
	}
	set dv(dv: DataviewInlineApi) {
		this.#dv = dv;
	}

	async onload(): Promise<void> {
		console.log("Loading TaskX...");

		// Wait for Dataview and Tasks to be available
		this.app.workspace.onLayoutReady(async () => {
			this.#dv = null;

			this.dvApi = this.getDataviewApi();
			this.tasksPlugin = this.getTasksPlugin();

			if (!this.dvApi) {
				console.warn("Dataview plugin not found!");
			}
			if (!this.tasksPlugin) {
				console.warn("Tasks plugin not found!");
			}

			console.log("TaskX initialized.");
		});
	}

	onunload(): void {
		console.log("Unloading TaskX...");
	}

	// --- helpers ------------------------------------------------------------

	private getDataviewApi(): DataviewApi | null {
		return this.app.plugins?.plugins?.["dataview"]?.api ?? null;
	}

	private getTasksPlugin(): TasksPlugin | null {
		return this.app.plugins?.plugins?.["obsidian-tasks-plugin"] ?? null;
	}

	private static hasTasksPlugin(plugin: TasksPlugin | null): plugin is TasksPlugin {
		return plugin !== null;
	}

	// --- exposed API --------------------------------------------------------

	// this.dv is expected to have been set up at the top of any calling block
	// with the simple line: taskx.dv = dv; We rely on the block crashing to warn
	// us of a bug.

	// Likewise this.tasksPlugin is expected to be properly set thereafter.

	doThis(): void {
		if (!TaskXPlugin.hasTasksPlugin(this.tasksPlugin)) {
			console.warn("Tasks plugin not loaded");
			return;
		}

		const tasks = this.tasksPlugin.getTasks(); // <-- this should return all cached tasks

		// Define today
		const today = window.moment().format("YYYY-MM-DD");

		// Filter tasks (respecting excluded folders)
		const filtered = tasks.filter((t) => {
			const folder = t.path.split("/").slice(0, -1).join("/");
			return folder !== "Templates" && folder !== "6 - Archives/Templates";
		});

		// Manually group by file path
		const grouped: Map<string, Task[]> = new Map();
		for (const t of filtered) {
			const group = grouped.get(t.path) ?? [];
			group.push(t);

			if (!grouped.has(t.path)) {
				grouped.set(t.path, group);
			}
		}

		// Build summary rows
		const rows = [];
		for (const [file, fileTasks] of grouped) {
			const total = fileTasks.length;
			const done = fileTasks.filter((t) => t.doneDate).length;
			const doneToday = fileTasks.filter(
				(t) => t.doneDate && t.doneDate.format("YYYY-MM-DD") === today,
			).length;
			const remaining = total - done;

			if (total > 0) {
				rows.push({
					file,
					totalRemaining: remaining,
					totalDoneToday: doneToday,
				});
			}
		}

		// Collapse into one summary row (like sum(rows.Remaining), sum(rows.DoneToday))
		const summary = {
			TotalRemaining: rows.reduce((a, r) => a + r.totalRemaining, 0),
			TotalDoneToday: rows.reduce((a, r) => a + r.totalDoneToday, 0),
		};

		// Render table
		this.dv.table(
			["Tâches accomplies aujourd'hui", "Tâches restantes"],
			[[summary.TotalDoneToday, summary.TotalRemaining]],
		);
	}

	doThat(): void {
		this.dv.paragraph("Do that!");
	}
}
