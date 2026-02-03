import { PluginSettingTab } from "obsidian";

export interface Resolver {}
export interface TaskXPluginSettings {}

export function compileResolver(_args: {}): Resolver {
	return {};
}

export class TaskXSettingTab extends PluginSettingTab {
	display(): void {}
}
