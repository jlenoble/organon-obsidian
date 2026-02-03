import { type App, PluginSettingTab } from "obsidian";

import { type TaskXPluginInterface } from "../types/taskx-plugin";
import { toggleButton } from "../ui";
import { normalizeList, type NormalizationOptions } from "./normalize-tag";

export class TaskXSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: TaskXPluginInterface,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const makeOnChange =
			(propName: keyof NormalizationOptions) =>
			async (v: boolean): Promise<void> => {
				this.plugin.settings[propName] = v;

				// Optional: normalize existing tags in-place
				this.normalizeAllTags();
				await this.plugin.saveSettings();
				this.display();
			};

		// Global normalization toggles
		toggleButton({
			containerEl,
			name: "Normalize tags to lowercase",
			description: "If enabled, tags are stored and matched in lowercase.",
			initValue: this.plugin.settings.normalizeTagsToLowercase,
			onChange: makeOnChange("normalizeTagsToLowercase"),
		});
		toggleButton({
			containerEl,
			name: "Allow hyphens and underscores",
			description: "If enabled, tags may contain '-' or '_'.",
			initValue: this.plugin.settings.looseHyphenMatching,
			onChange: makeOnChange("looseHyphenMatching"),
		});
	}

	normalizeAllTags(): void {
		this.plugin.settings.handledTags = normalizeList(
			this.plugin.settings.handledTags,
			this.plugin.settings,
		);
	}
}
