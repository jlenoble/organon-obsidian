import { scoreTask } from "../scoring";
import { Taskx } from "../utils";
import { bin3, frictionBadge } from "./binning";
import { type ExtendedDecisionOptions } from "./decision-options";

export function decisionCell(options: ExtendedDecisionOptions): void {
	const {
		dv,
		dvTasks,
		gBin,
		pBin,
		bins,
		keepBlocked,
		graphs: { dependsOn },
	} = options;

	dv.taskList(
		dvTasks
			.map(t => {
				const task = Taskx.getTaskxFromDvTask(t)!;
				const { id, dimensions, score } = scoreTask(task, options);
				return {
					...t,
					id,
					dimensions,
					score,
					visual: `(${dimensions.gain},${dimensions.pressure},${frictionBadge(dimensions.friction, bins.friction)}) ${score}  ${task?.markdown}`,
				};
			})
			.sort(({ score }) => score, "desc")
			.filter(({ id, dimensions: { gain, pressure } }) => {
				const blocked = dependsOn.neighbors(id, "dependsOn", "out").length > 0;
				return (
					(!blocked || keepBlocked) &&
					bin3(gain, bins.gain) === gBin &&
					bin3(pressure, bins.pressure) === pBin
				);
			}),
		false,
	);
}
