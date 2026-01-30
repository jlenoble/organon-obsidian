// Empty declaration to allow for css imports
declare module "*.css" {}

type Task = ObsidianTasks.Task;
type TasksPlugin = ObsidianTasks.TasksPlugin;

type Brand<T, B> = T & { readonly __brand: B };

type TaskxMarkdown = Brand<string, "Markdown">;
type TaskxPath = Brand<string, "Path">;
