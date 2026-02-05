import type { DataArray, DvTask } from "obsidian-dataview";

import { type Dimensions, scoreTask } from "../scoring";
import { TaskX } from "../utils";
import { frictionBadge } from "./binning";
import { type ExtendedDecisionOptions } from "./decision-options";

export const allDvTasks = (
	options: ExtendedDecisionOptions,
): DataArray<DvTask & { id: TaskXId; dimensions: Dimensions; score: number }> => {
	const { dvTasks, bins, durations } = options;

	return dvTasks
		.map(t => {
			const task = TaskX.getTaskXFromDvTask(t)!;
			const { id, dimensions, score } = scoreTask(task, options);
			const duration = durations.get(id)!;

			return {
				...t,
				id,
				dimensions,
				score,
				duration,
				visual: `(${dimensions.gain},${dimensions.pressure},${frictionBadge(dimensions.friction, bins.friction)}) ${score}  ${task?.markdown}`,
			};
		})
		.sort(({ score }) => score, "desc");
};
