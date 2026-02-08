import type { DataArray } from "obsidian-dataview";

import { scoreTask } from "../scoring";
import { extractDurationTokenWithEmoji, formatTaskDurationToken, TaskX } from "../utils";
import { frictionBadge } from "./binning";
import { isAuthorityTask } from "./decision-engine";
import type { ExtDvTask, ExtendedDecisionOptions } from "./decision-options";

export const allDvTasks = (options: ExtendedDecisionOptions): DataArray<ExtDvTask> => {
	const { dvTasks, bins, durations } = options;

	return dvTasks
		.map(t => {
			const taskx = TaskX.getTaskXFromDvTask(t)!;

			const { id, dimensions, score } = scoreTask(taskx, options);
			const prefix = `(${dimensions.gain},${dimensions.pressure},${frictionBadge(dimensions.friction, bins.friction)}) ${score.toFixed(1)}`;

			const duration = durations.get(id);

			let description = taskx.description;

			if (duration) {
				const oldDurationToken = extractDurationTokenWithEmoji(taskx.description)!;
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

			const isAuthority = isAuthorityTask(taskx, options);

			const markdown = taskx.markdown.replace(taskx.description, description);

			const visual = `${prefix} ${markdown}`;
			const task: ExtDvTask = {
				...t,
				id,
				dimensions,
				score,
				duration,
				isAuthority,
				taskx,
			};

			return { ...task, visual };
		})
		.sort(({ score }) => score, "desc");
};
