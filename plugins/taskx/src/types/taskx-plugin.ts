import { type Plugin } from "obsidian";

import type { Resolver, TaskXPluginSettings } from "../settings";

export interface TaskXPluginInterface extends Plugin {
	settings: TaskXPluginSettings;
	resolver: Resolver;

	saveSettings(): Promise<void>;
}
