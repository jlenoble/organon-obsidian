// Empty declaration to allow for css imports
declare module "*.css" {}

type Task = ObsidianTasks.Task;
type TasksPlugin = ObsidianTasks.TasksPlugin;

type Brand<T, B> = T & { readonly __brand: B };

type TaskXId = Brand<string, "TaskXId">;
type TaskXMarkdown = Brand<string, "Markdown">;
type TaskXPath = Brand<string, "Path">;

type Tag = Brand<string, "Tag">; // #tic, #admin...
type Locale = "fr" | "en"; // "fr", "en", "fr-FR", etc.
