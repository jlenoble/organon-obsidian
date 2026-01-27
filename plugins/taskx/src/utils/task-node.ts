import { extractParentId } from "./extractors";

export function buildTaskNodes(taskMap: Map<string, Task>): TaskNode[] {
	const taskNodeMap: Map<string, TaskNode> = new Map();

	// Build lookup by ID
	for (const [id, task] of taskMap) {
		const parentId = extractParentId(task);
		taskNodeMap.set(id, { id, parentId, children: [], data: task });
	}

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
