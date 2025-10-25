import { type ExtendedSummaryOptions } from "./summary-options";

type Task = ObsidianTasks.Task;

export function makeExcludeFolders({
	excludeFolders,
}: ExtendedSummaryOptions): (t: Task) => boolean {
	return (t: Task): boolean => {
		const dir = t.path.split("/").slice(0, -1).join("/");
		return !excludeFolders.contains(dir);
	};
}

export function done(t: Task): boolean {
	return t.doneDate !== null;
}

export function doneToday(t: Task): boolean {
	const today = window.moment().format("YYYY-MM-DD");
	return !!(t.doneDate && t.doneDate.format("YYYY-MM-DD") === today);
}
