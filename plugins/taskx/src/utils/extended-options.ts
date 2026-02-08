import { type DataviewInlineApi } from "obsidian-dataview";

import { processTasks, type ProcessedTasks } from "./process-tasks";
import { type Resolver } from "../settings";
import { type TaskXPluginInterface } from "../types/taskx-plugin";

export interface Options {
	readonly excludeFolders?: string[];
	readonly keepBlocked?: boolean;
	readonly keepDone?: boolean;
	readonly keepNotStarted?: boolean;
}

export interface ExtOptions {
	readonly dv: DataviewInlineApi;
	readonly tasksPlugin: TasksPlugin;
	readonly resolver: Resolver;
	readonly settings: TaskXPluginInterface["settings"];
}

export interface ExtendedOptions extends Required<Options>, ExtOptions, ProcessedTasks {
	readonly authorityTags: Tag[];
}

export const defaultOptions: Required<Options> = {
	excludeFolders: ["Templates"],
	keepBlocked: false,
	keepDone: false,
	keepNotStarted: false,
};

export function buildExtendedOptions(options: Options, extOptions: ExtOptions): ExtendedOptions {
	const opts: Required<Options> = { ...defaultOptions, ...options };

	const tasks = extOptions.tasksPlugin.getTasks(); // <-- this should return all cached tasks
	const dvTasks = extOptions.dv.pages().file.tasks;

	const authorityTags: Set<Tag> = new Set();

	for (const spec of extOptions.settings.meaningSpecs) {
		if (spec.isAuthority) {
			for (const tag of spec.neutralAliases) {
				authorityTags.add(tag);
			}
			for (const lex of Object.values(spec.languages)) {
				authorityTags.add(lex.canonical);
				for (const tag of lex.aliases) {
					authorityTags.add(tag);
				}
			}
		}
	}

	return {
		...opts,
		...extOptions,
		...processTasks(tasks, dvTasks, opts),
		authorityTags: Array.from(authorityTags),
	};
}
