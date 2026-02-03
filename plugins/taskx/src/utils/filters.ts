import { type TaskX } from "./taskx";

type HasPath = { path: string };

export function makeExcludeFolders<T extends HasPath>(
	excludeFolders: readonly string[],
): (t: T) => boolean {
	const excluded = excludeFolders.map(f => f.replace(/\/+$/, "")); // normalize

	return (t: T): boolean => {
		const dir = t.path.split("/").slice(0, -1).join("/");

		return !excluded.some(ex => dir === ex || dir.startsWith(ex + "/"));
	};
}

export function done(t: TaskX): boolean {
	return t.doneDate !== null;
}

export function remaining(t: TaskX): boolean {
	return t.doneDate === null;
}

export function doneToday(t: TaskX): boolean {
	const today = window.moment().format("YYYY-MM-DD");
	return !!(t.doneDate && t.doneDate.format("YYYY-MM-DD") === today);
}
