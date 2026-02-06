import type { DataArray, DvTask } from "obsidian-dataview";

import { type Dimensions, scoreTask } from "../scoring";
import { extractDurationTokenWithEmoji, formatTaskDurationToken, TaskX } from "../utils";
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
			const prefix = `(${dimensions.gain},${dimensions.pressure},${frictionBadge(dimensions.friction, bins.friction)}) ${score.toFixed(1)}`;

			const duration = durations.get(id);

			let description = task.description;

			if (duration) {
				const oldDurationToken = extractDurationTokenWithEmoji(task.description)!;
				const newDurationToken = formatTaskDurationToken(duration);

				if (oldDurationToken) {
					// Then duration is not computed, or seemingly overridden
					description = description.replace(oldDurationToken, newDurationToken);
				} else {
					// Else duration is only computed
					description = `${description} ${newDurationToken}`;
				}
			} else {
				description = description + " ⏱️ ❓";
			}

			const markdown = task.markdown.replace(task.description, description);

			return {
				...t,
				id,
				dimensions,
				score,
				duration,
				visual: `${prefix} ${markdown}`,
			};
		})
		.sort(({ score }) => score, "desc");
};
