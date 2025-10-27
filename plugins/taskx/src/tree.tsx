import { PrimeReactProvider } from "primereact/api";
import { Tree } from "primereact/tree";
import { type JSX } from "react";
import { createRoot } from "react-dom/client";

import { remaining } from "./filters";
import { getFilteredTasks } from "./helpers";
import { type ExtendedSummaryOptions } from "./summary-options";

// Extract the 🆔 value from a task’s text
export function extractId(task: Task): string | null {
	const text = task.originalMarkdown ?? "";
	const m = text.match(/🆔\s*([A-Za-z0-9_-]+)/);
	return m ? m[1] : null;
}

// Extract the parent reference from 🌿
export function extractParentId(task: Task): string | null {
	const text = task.description ?? task.originalMarkdown ?? "";
	const m = text.match(/🌿\s*([A-Za-z0-9_-]+)/);
	return m ? m[1] : null;
}

function buildTaskNodes(tasks: Task[]): TaskNode[] {
	// Build lookup by ID
	const taskNodeMap: Map<string, TaskNode> = new Map(
		tasks.map(t => {
			const id = extractId(t) ?? t.originalMarkdown ?? "";
			const parentId = extractParentId(t);
			return [id, { id, parentId, children: [], data: t }];
		}),
	);

	const taskNodes: TaskNode[] = [];

	// Construct hierarchy
	for (const taskNode of taskNodeMap.values()) {
		if (!taskNode.parentId) {
			taskNodes.push(taskNode);
		} else {
			const parentTaskNode = taskNodeMap.get(taskNode.parentId);

			if (parentTaskNode) {
				parentTaskNode.children.push(taskNode);
			}
		}
	}

	return taskNodes;
}

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
	const { dv } = options;
	const container = dv.el("div", { cls: "taskx-tree" });

	const tasks = getFilteredTasks(options).filter(remaining);
	const taskNodes = buildTaskNodes(tasks);
	const treeNodes = convertTaskNodesToTreeNodes(taskNodes);

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
