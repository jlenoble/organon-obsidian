import { PrimeReactProvider } from "primereact/api";
import { Tree, type TreeCheckboxSelectionKeys } from "primereact/tree";
import { useState, type JSX } from "react";
import { createRoot } from "react-dom/client";

import { type ExtendedSummaryOptions } from "./summary-options";
import type { TreeNode, TaskNode } from "../utils";

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
	const { dv, tasksPlugin, taskNodes } = options;
	const container = dv.el("div", "", { cls: "taskx-tree" });

	const treeNodes = convertTaskNodesToTreeNodes(taskNodes.filter(n => n.data.doneDate === null));

	/**
	 * PrimeReact TreeView component
	 */
	const TreeView = (): JSX.Element => {
		const [selectionKeys, setSelectionKeys] = useState<TreeCheckboxSelectionKeys>({});

		async function toggleTaskInObsidian(task: Task): Promise<void> {
			try {
				console.log(
					tasksPlugin.apiV1.executeToggleTaskDoneCommand(task.originalMarkdown, task.path),
				);
			} catch (err) {
				console.error("Failed to toggle task:", err);
			}
		}

		function findChangedKey(
			prev: TreeCheckboxSelectionKeys,
			next: TreeCheckboxSelectionKeys,
		): string | null {
			const allKeys = new Set([...Object.keys(prev ?? {}), ...Object.keys(next ?? {})]);
			for (const key of allKeys) {
				const before = prev?.[key]?.checked ?? false;
				const after = next?.[key]?.checked ?? false;
				if (before !== after) {
					return key;
				}
			}
			return null;
		}

		function findNodeByKey(nodes: TreeNode[], key: string): TreeNode | null {
			for (const n of nodes) {
				if (n.key === key) {
					return n;
				}
				const child = n.children && findNodeByKey(n.children, key);
				if (child) {
					return child;
				}
			}
			return null;
		}

		return (
			<PrimeReactProvider value={{ unstyled: false }}>
				<div className="taskx-tree-container">
					<Tree
						value={treeNodes}
						selectionMode="checkbox"
						selectionKeys={selectionKeys}
						onSelectionChange={async e => {
							const newValue = (e.value ?? {}) as TreeCheckboxSelectionKeys;
							const changedKey = findChangedKey(selectionKeys, newValue);
							setSelectionKeys(newValue);

							if (changedKey) {
								const node = findNodeByKey(treeNodes, changedKey);
								if (node?.data?.data) {
									await toggleTaskInObsidian(node.data.data);
								}
							}
						}}
					/>
				</div>
			</PrimeReactProvider>
		);
	};

	const root = createRoot(container);
	root.render(<TreeView />);
}
