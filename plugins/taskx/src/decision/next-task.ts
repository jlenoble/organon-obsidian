import { allDvTasks } from "./all-dvtasks";
import { type ExtendedDecisionOptions } from "./decision-options";

export function nextTask(options: ExtendedDecisionOptions): void {
	const {
		dv,
		keepBlocked,
		graphs: { dependsOn },
	} = options;

	dv.taskList(
		allDvTasks(options)
			.filter(({ id }) => {
				const blocked = dependsOn.neighbors(id, "dependsOn", "out").length > 0;
				return !blocked || keepBlocked;
			})
			.filter((_opt, i) => i === 0),
		false,
	);
}
