import type { DataviewInlineApi } from "obsidian-dataview";

export function isTasksPlugin(plugin: TasksPlugin | null): plugin is TasksPlugin {
	return plugin !== null;
}

export function isDataviewInlineApi(api: DataviewInlineApi | null): api is DataviewInlineApi {
	return api !== null;
}
