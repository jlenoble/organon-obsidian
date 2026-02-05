import { allDvTasks, type ExtendedDecisionOptions } from "../decision";

export function missingDurations(options: ExtendedDecisionOptions): void {
	const {
		dv,
		durations,
		graphs: { partOf },
	} = options;

	dv.taskList(
		allDvTasks(options).filter(({ id }) => {
			// children are incoming edges to the parent node (because edge is child -> parent)
			const isLeaf = partOf.neighbors(id, "partOf", "in").length === 0;
			return isLeaf && !durations.has(id);
		}),
		false,
	);
}
