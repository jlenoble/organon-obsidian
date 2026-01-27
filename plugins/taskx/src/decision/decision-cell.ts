import { Taskx } from "../utils";
import { type ExtendedDecisionOptions } from "./decision-options";

export function decisionCell(options: ExtendedDecisionOptions): void {
	const { dv, dvTasks } = options;

	dv.taskList(
		dvTasks.map(t => {
			const task = Taskx.getTaskxFromDvTask(t);
			return { ...t, visual: task?.markdown };
		}),
		false,
	);
}
