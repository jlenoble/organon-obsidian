import { type ExtendedSummaryOptions } from "./summary-options";

type Task = ObsidianTasks.Task;

export function table({ tasksPlugin, dv }: ExtendedSummaryOptions): void {
	const tasks = tasksPlugin.getTasks(); // <-- this should return all cached tasks

	// Define today
	const today = window.moment().format("YYYY-MM-DD");

	// Filter tasks (respecting excluded folders)
	const filtered = tasks.filter(t => {
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
		const done = fileTasks.filter(t => t.doneDate).length;
		const doneToday = fileTasks.filter(
			t => t.doneDate && t.doneDate.format("YYYY-MM-DD") === today,
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

	dv.table(
		["Tâches accomplies aujourd'hui", "Tâches restantes"],
		[[summary.TotalDoneToday, summary.TotalRemaining]],
	);
}
