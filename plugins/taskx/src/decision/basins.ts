import { allDvTasks } from "./all-dvtasks";
import { type Basin, DecisionEngine } from "./decision-engine";
import { type ExtendedDecisionOptions } from "./decision-options";

export function basin(options: ExtendedDecisionOptions & { basin: Basin }): void {
	const engine = new DecisionEngine(options);

	options.dv.taskList(
		allDvTasks(options)
			.map(task => engine.decideForTask(task, options.basin))
			.filter(task => task !== null),
		false,
	);
}
