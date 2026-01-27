import { type ExtendedDecisionOptions } from "./decision-options";

export function decisionCell(options: ExtendedDecisionOptions): void {
	const { dv } = options;

	dv.taskList(dv.pages().file.tasks, false);
}
