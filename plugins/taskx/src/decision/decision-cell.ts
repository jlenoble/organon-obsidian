import { type ExtendedDecisionOptions } from "./decision-options";
import { makeExcludeFolders, Taskx } from "../utils";

export function decisionCell(options: ExtendedDecisionOptions): void {
	const { dv, excludeFolders } = options;

	dv.taskList(
		dv
			.pages()
			.file.tasks.where(makeExcludeFolders(excludeFolders))
			.map(t => {
				return Taskx.fromDvTask(t) || t;
			}),
		false,
	);
}
