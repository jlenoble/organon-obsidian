import { allDvTasks } from "./all-dvtasks";
import { bin3 } from "./binning";
import { type ExtendedDecisionOptions } from "./decision-options";

export function decisionCell(options: ExtendedDecisionOptions): void {
	const {
		dv,
		gBin,
		pBin,
		bins,
		keepBlocked,
		graphs: { dependsOn },
	} = options;

	dv.taskList(
		allDvTasks(options).filter(({ id, dimensions: { gain, pressure } }) => {
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
