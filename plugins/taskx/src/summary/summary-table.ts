import { type ExtendedSummaryOptions } from "./summary-options";
import { done, doneToday } from "../utils/filters";
import { getGroupedTasks } from "../utils/helpers";
export function summaryTable(options: ExtendedSummaryOptions): void {
	const { dv } = options;
	const grouped = getGroupedTasks(options);

	// Build summary rows
	const rows = [];
	for (const [key, tasks] of grouped) {
		const total = tasks.length;
		const totalDone = tasks.filter(done).length;
		const totalDoneToday = tasks.filter(doneToday).length;
		const totalRemaining = total - totalDone;

		if (total > 0) {
			rows.push({
				key,
				totalRemaining,
				totalDoneToday,
			});
		}
	}

	switch (options.groupBy) {
		case "file":
			// Render table
			dv.table(
				["File", "Tâches accomplies aujourd'hui", "Tâches restantes"],
				rows.map(r => ["[[" + r.key + "]]", r.totalDoneToday, r.totalRemaining]),
			);
			break;

		case "tag":
			// Render table
			dv.table(
				["Tag", "Tâches accomplies aujourd'hui", "Tâches restantes"],
				rows.map(r => [r.key, r.totalDoneToday, r.totalRemaining]),
			);
			break;

		case "none":
		default:
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
			break;
	}
}
