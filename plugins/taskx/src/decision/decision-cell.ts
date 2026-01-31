import { scoreTask } from "../scoring";
import { Taskx } from "../utils";
import { type ExtendedDecisionOptions } from "./decision-options";

export function decisionCell(options: ExtendedDecisionOptions): void {
	const { dv, dvTasks } = options;

	dv.taskList(
		dvTasks
			.map(t => {
				const task = Taskx.getTaskxFromDvTask(t)!;
				const { score } = scoreTask(task, options);
				return { ...t, score, visual: `${score}  ${task?.markdown}` };
			})
			.sort(({ score }) => score, "desc"),
		false,
	);
}
