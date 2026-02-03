import { Notice } from "obsidian";

import { type NormalizationOptions, normalize, normalizeList } from "../settings";
import { CodeMirrorListEditor } from "./CodeMirrorListEditor";
import { TagInputModal } from "./TagInputModal";
import { type TaskXPluginInterface } from "../types/taskx-plugin";
import { type TaskXDisposable } from "../utils";
export interface TagEditorOptions {
	plugin: TaskXPluginInterface;
	containerEl: HTMLElement;
	initValue: string;
	onChange(value: string): void;
}

export class TagEditor implements TaskXDisposable {
	#cmEditor: CodeMirrorListEditor;
	#plugin: TaskXPluginInterface;

	constructor({ plugin, containerEl, initValue, onChange }: TagEditorOptions) {
		this.#plugin = plugin;
		const options: NormalizationOptions = {
			normalizeTagsToLowercase: plugin.settings.normalizeTagsToLowercase,
			looseHyphenMatching: plugin.settings.looseHyphenMatching,
		};

		// Layout: textarea left, buttons right
		const row = containerEl.createDiv({ cls: "taskx-tag-editor-row" });
		const left = row.createDiv({ cls: "taskx-tag-editor-left" });
		const right = row.createDiv({ cls: "taskx-tag-editor-right" });

		// CodeMirror mount point
		const editorHost = left.createDiv({ cls: "taskx-cm-host" });

		this.#cmEditor = new CodeMirrorListEditor({
			containerEl: editorHost,
			initValue,
			placeholder: "One tag per line…",
			onChange,
			readOnly: true,
		});

		// Buttons
		const addBtn = right.createEl("button", { text: "Add" });
		addBtn.addClass("mod-cta");
		addBtn.onclick = async (): Promise<void> => {
			new TagInputModal(this.#plugin.app, {
				title: "Add tag",
				description: "Enter a tag. It will be normalized (#, lowercase if enabled).",
				placeholder: "e.g. #work",
				initialValue: "",
				validate: (raw): string | null => {
					const t = normalize(raw, options);
					if (!t) {
						return "Invalid tag (no spaces).";
					}
					return null;
				},
				onSubmit: async (raw): Promise<void> => {
					const t = normalize(raw, options) as Tag | null;

					if (!t) {
						new Notice("Invalid tag.");
						return;
					}

					const current = this.#plugin.settings.handledTags.map(String);
					if (current.includes(String(t))) {
						new Notice("Tag already present.");
						return;
					}

					this.#plugin.settings.handledTags = [...this.#plugin.settings.handledTags, t];
					await this.#plugin.saveSettings();
					new Notice("Saved.");

					this.#cmEditor.setValue(this.#plugin.settings.handledTags.join("\n"));
				},
			}).open();
		};

		const editBtn = right.createEl("button", { text: "Edit selected" });
		editBtn.onclick = async (): Promise<void> => {
			console.log("edit");
		};

		const removeBtn = right.createEl("button", { text: "Remove selected" });
		removeBtn.addClass("mod-warning");
		removeBtn.onclick = async (): Promise<void> => {
			console.log("remove");
		};
	}

	dispose(): void {
		this.#cmEditor.dispose();
	}

	readEditorTags(options: NormalizationOptions): Tag[] {
		// Read editor → normalized Tag[]
		const lines = this.splitLines(this.#cmEditor.getValue());
		const norm = normalizeList(lines, options);

		// avoid duplicates while keeping order
		return this.uniquePreserveOrder(norm);
	}

	writeEditorTags(tags: Tag[]): void {
		// Write Tag[] → editor
		this.#cmEditor.setValue(tags.join("\n"));
	}

	async persistFromEditor(options: NormalizationOptions): Promise<void> {
		// Persist editor → settings
		const tags = this.readEditorTags(options);
		this.#plugin.settings.handledTags = tags;
		await this.#plugin.saveSettings();
	}

	splitLines(text: string): string[] {
		return text
			.split(/\r?\n/g)
			.map(s => s.trim())
			.filter(Boolean);
	}

	uniquePreserveOrder(xs: Tag[]): Tag[] {
		const seen = new Set<Tag>();
		const out: Tag[] = [];
		for (const x of xs) {
			if (seen.has(x)) {
				continue;
			}
			seen.add(x);
			out.push(x);
		}
		return out;
	}
}
