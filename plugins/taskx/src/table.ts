import { done, doneToday } from "./filters";
import { getTasksGroupedByFile } from "./helpers";
import { type ExtendedSummaryOptions } from "./summary-options";

export function table(options: ExtendedSummaryOptions): void {
	const { dv } = options;
	const grouped = getTasksGroupedByFile(options);

	// Build summary rows
	const rows = [];
	for (const [file, fileTasks] of grouped) {
		const total = fileTasks.length;
		const totalDone = fileTasks.filter(done).length;
		const totalDoneToday = fileTasks.filter(doneToday).length;
		const totalRemaining = total - totalDone;

		if (total > 0) {
			rows.push({
				file,
				totalRemaining,
				totalDoneToday,
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
