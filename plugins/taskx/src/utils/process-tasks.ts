import { extractId, extractParentId } from "./extractors";
import { makeTempTaskId } from "./temp-id";

export interface ProcessedTasks {
	readonly taskMap: Map<string, Task>;
	readonly tasksMissingIds: Array<Task>;
	readonly tasksUsurpingIds: Array<Task>;
	readonly taskNodes: Array<TaskNode>;
}

export function processTasks(tasks: Array<Task>): ProcessedTasks {
	const taskMap: Map<string, Task> = new Map();
	const tasksMissingIds: Task[] = [];
	const tasksUsurpingIds: Task[] = [];

	for (const task of tasks) {
		let id = extractId(task.originalMarkdown ?? "");

		if (id === null) {
			tasksMissingIds.push(task);
			id = makeTempTaskId(task.path, task.originalMarkdown);
		}

		if (!taskMap.has(id)) {
			taskMap.set(id, task);
		} else {
			tasksUsurpingIds.push(task);
		}
	}

	const taskNodes: TaskNode[] = buildTaskNodes(taskMap);

	return {
		taskMap,
		tasksMissingIds,
		tasksUsurpingIds,
		taskNodes,
	};
}

export function buildTaskNodes(taskMap: Map<string, Task>): TaskNode[] {
	const taskNodeMap: Map<string, TaskNode> = new Map();

	// Build lookup by ID
	for (const [id, task] of taskMap) {
		const parentId = extractParentId(task.originalMarkdown ?? "");
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
