import { PrimeReactProvider } from "primereact/api";
import { Tree } from "primereact/tree";
import { type JSX } from "react";
import { createRoot } from "react-dom/client";

import { type ExtendedSummaryOptions } from "./summary-options";

/**
 * Converts TaskNode structure into PrimeReact's TreeNode format.
 */
function convertTaskNodesToTreeNodes(tasks: TaskNode[]): TreeNode[] {
	return tasks.map(task => ({
		key: task.id,
		label: task.data.description,
		icon: task.children.length ? "pi pi-folder" : "pi pi-file",
		children: task.children.length ? convertTaskNodesToTreeNodes(task.children) : [],
		data: task,
	}));
}

export function tree(options: ExtendedSummaryOptions): void {
	const { dv, taskNodes } = options;
	const container = dv.el("div", { cls: "taskx-tree" });

	const treeNodes = convertTaskNodesToTreeNodes(taskNodes.filter(n => n.data.doneDate === null));

	/**
	 * PrimeReact TreeView component
	 */
	const TreeView = (): JSX.Element => (
		<PrimeReactProvider value={{ unstyled: false }}>
			<Tree value={treeNodes} selectionMode="single" />
		</PrimeReactProvider>
	);

	const root = createRoot(container);
	root.render(<TreeView />);
}
