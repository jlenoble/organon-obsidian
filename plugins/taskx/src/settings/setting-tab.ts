import { type App, PluginSettingTab, Setting } from "obsidian";

import { type TaskXPluginInterface } from "../types/taskx-plugin";
import { TagEditor, toggleButton } from "../ui";
import { normalizeSpecList } from "./normalize-spec";
import { type NormalizationOptions } from "./normalize-tag";
import { parseBaseScoreOrKeep, type Dimensions } from "../scoring";
import { TaskXDisposer } from "../utils";

export class TaskXSettingTab extends PluginSettingTab {
	private disposer: TaskXDisposer = new TaskXDisposer();

	constructor(
		app: App,
		private plugin: TaskXPluginInterface,
	) {
		super(app, plugin);
	}

	display(): void {
		// Single cleanup trigger for previous UI (including CM editor)
		this.disposer.dispose();

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
			name: "Forbid hyphens and underscores",
			description: "If enabled, tags are stripped from '-' or '_'.",
			initValue: this.plugin.settings.removeHyphensAndUnderscores,
			onChange: makeOnChange("removeHyphensAndUnderscores"),
		});

		// Dimensions
		const fb: Dimensions = this.plugin.settings.fallbackDefaults;
		new Setting(containerEl)
			.setName("Fallback dimensions")
			.setDesc("Used when no meaning matches any tag.")
			.addText(t =>
				t
					.setPlaceholder("gain")
					.setValue(String(fb.gain))
					.onChange(async v => {
						fb.gain = parseBaseScoreOrKeep(fb.gain, v);
						await this.plugin.saveSettings();
					}),
			)
			.addText(t =>
				t
					.setPlaceholder("pressure")
					.setValue(String(fb.pressure))
					.onChange(async v => {
						fb.pressure = parseBaseScoreOrKeep(fb.pressure, v);
						await this.plugin.saveSettings();
					}),
			)
			.addText(t =>
				t
					.setPlaceholder("friction")
					.setValue(String(fb.friction))
					.onChange(async v => {
						fb.friction = parseBaseScoreOrKeep(fb.friction, v);
						await this.plugin.saveSettings();
					}),
			);

		const editor = new TagEditor({
			plugin: this.plugin,
			containerEl: containerEl.createDiv({ cls: "taskx-tag-editor-host" }),
			initValue: this.plugin.settings.meaningSpecs.map(spec => spec.id).join("\n"),
			onChange: (): void => {},
		});

		// Register editor cleanup
		this.disposer.add(() => editor.dispose());
	}

	dispose(): void {
		this.disposer.dispose();
	}

	normalizeAllTags(): void {
		this.plugin.settings.meaningSpecs = normalizeSpecList(
			this.plugin.settings.meaningSpecs,
			this.plugin.settings,
		);
	}
}
