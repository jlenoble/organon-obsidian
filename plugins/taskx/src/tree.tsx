import { PrimeReactProvider } from "primereact/api";
import { Tree } from "primereact/tree";
import { type JSX } from "react";
import { createRoot } from "react-dom/client";

import { type ExtendedSummaryOptions } from "./summary-options";

interface TaskNode {
	id: string;
	title: string;
	dueDate?: string;
	children?: TaskNode[];
}

type TreeNode = {
	key: string;
	label: string;
	icon: string;
	children?: TreeNode[];
	data: TaskNode;
};

/**
 * Converts your TaskNode structure into PrimeReact's TreeNode format.
 */
function convertTasksToTreeNodes(tasks: TaskNode[]): TreeNode[] {
	return tasks.map(task => ({
		key: task.id,
		label: task.title,
		icon: task.children?.length ? "pi pi-folder" : "pi pi-file",
		children: task.children ? convertTasksToTreeNodes(task.children) : undefined,
		data: task,
	}));
}

export function tree({ dv }: ExtendedSummaryOptions): void {
	const container = dv.el("div", { cls: "taskx-tree" });
	const today = window.moment().format("YYYY-MM-DD");

	// Example dummy data
	const tasks: TaskNode[] = [
		{
			id: "1",
			title: "Do laundry",
			dueDate: today,
			children: [
				{ id: "1.1", title: "Wash clothes" },
				{ id: "1.2", title: "Dry clothes" },
			],
		},
		{
			id: "2",
			title: "Write report",
			dueDate: today,
		},
	];

	const nodes = convertTasksToTreeNodes(tasks);

	/**
	 * PrimeReact TreeView component
	 */
	const TreeView = (): JSX.Element => (
		<PrimeReactProvider value={{ unstyled: false }}>
			<Tree value={nodes} selectionMode="single" />
		</PrimeReactProvider>
	);

	const root = createRoot(container);
	root.render(<TreeView />);
}
