// Empty declaration to allow for css imports
declare module "*.css" {}

type Task = ObsidianTasks.Task;
type TasksPlugin = ObsidianTasks.TasksPlugin;

interface TaskNode {
	id: string;
	children: TaskNode[];
	parentId: string | null;
	data: Task;
}

type TreeNode = {
	key: string;
	label: string;
	icon: string;
	children: TreeNode[];
	data: TaskNode;
};
