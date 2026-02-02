import { PluginSettingTab } from "obsidian";

export interface Resolver {}
export interface TaskxPluginSettings {}

export function compileResolver(_args: {}): Resolver {
	return {};
}

export class TaskxSettingTab extends PluginSettingTab {
	display(): void {}
}
