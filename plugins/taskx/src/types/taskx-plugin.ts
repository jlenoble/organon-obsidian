import { type Plugin } from "obsidian";

import type { Resolver, TaskxPluginSettings } from "../settings";

export interface TaskXPluginInterface extends Plugin {
	settings: TaskxPluginSettings;
	resolver: Resolver;

	saveSettings(): Promise<void>;
}
