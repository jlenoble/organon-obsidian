import { Notice } from "obsidian";

import {
	type MeaningId,
	type NormalizationOptions,
	normalizeMeaningId,
	normalizeMeaningIdList,
	normalizeSpecList,
} from "../settings";
import { CodeMirrorListEditor } from "./CodeMirrorListEditor";
import { ConfirmModal } from "./ConfirmModal";
import { MeaningSpecModal } from "./MeaningSpecModal";
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
			removeHyphensAndUnderscores: plugin.settings.removeHyphensAndUnderscores,
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
			new MeaningSpecModal(
				this.#plugin.app,
				{ mode: "create", initial: { dimensions: { ...this.#plugin.settings.fallbackDefaults } } },
				{
					normalization: options,
					isMeaningIdTaken: (id): boolean =>
						this.#plugin.settings.meaningSpecs.some(m => String(m.id) === id),
					onSubmit: async (spec): Promise<void> => {
						this.#plugin.settings.meaningSpecs = [...this.#plugin.settings.meaningSpecs, spec];
						await this.#plugin.saveSettings();

						const ids = this.#plugin.settings.meaningSpecs.map(m => String(m.id));
						this.#cmEditor.setValue(ids.join("\n"));
					},
				},
			).open();
		};

		const editBtn = right.createEl("button", { text: "Edit selected" });
		editBtn.onclick = async (): Promise<void> => {
			const selected = this.#cmEditor.getSelectedLine();
			if (!selected) {
				new Notice("Place the cursor on a line to edit that tag family name.");
				return;
			}

			const current = normalizeMeaningId(selected, options);
			if (!current) {
				new Notice("Selected line is not a valid tag family name.");
				return;
			}

			const index = this.findSpecIndex(current, options);

			if (index > -1) {
				new MeaningSpecModal(
					this.#plugin.app,
					{ mode: "edit", initial: this.#plugin.settings.meaningSpecs[index] },
					{
						normalization: options,
						isMeaningIdTaken: (id): boolean =>
							this.#plugin.settings.meaningSpecs.some((m, i) => i !== index && String(m.id) === id),
						onSubmit: async (spec): Promise<void> => {
							this.#plugin.settings.meaningSpecs[index] = spec;

							this.#plugin.settings.meaningSpecs = normalizeSpecList(
								this.#plugin.settings.meaningSpecs,
								options,
							);

							await this.#plugin.saveSettings();

							const ids = this.#plugin.settings.meaningSpecs.map(m => String(m.id));
							this.#cmEditor.setValue(ids.join("\n"));
						},
					},
				).open();
			} else {
				new Notice("Selected tag not found in list (maybe editor changed).");
				return;
			}
		};

		const removeBtn = right.createEl("button", { text: "Remove selected" });
		removeBtn.addClass("mod-warning");
		removeBtn.onclick = async (): Promise<void> => {
			const selected = this.#cmEditor.getSelectedLine();
			if (!selected) {
				new Notice("Place the cursor on a line to remove that tag family.");
				return;
			}

			const current = normalizeMeaningId(selected, options);
			if (!current) {
				new Notice("Selected line is not a valid tag family name.");
				return;
			}

			new ConfirmModal(this.#plugin.app, {
				title: "Remove tag family",
				message: `Remove ${String(current)}?`,
				confirmText: "Remove",
				cancelText: "Cancel",
				isDanger: true,
				onConfirm: async (): Promise<void> => {
					const ids = this.readEditorMeaningIds(options);
					const next = ids.filter(x => String(x) !== String(current));

					if (next.length === ids.length) {
						new Notice("Tag family not found in list (maybe editor changed).");
						return;
					}

					this.writeEditorMeaningIds(next);
					await this.persistFromEditor(options);
				},
			}).open();
		};
	}

	dispose(): void {
		this.#cmEditor.dispose();
	}

	readEditorMeaningIds(options: NormalizationOptions): MeaningId[] {
		// Read editor → normalized MeningId[]
		const lines = this.splitLines(this.#cmEditor.getValue());
		const norm = normalizeMeaningIdList(lines, options);

		// avoid duplicates while keeping order
		return this.uniquePreserveOrder(norm);
	}

	writeEditorMeaningIds(ids: MeaningId[]): void {
		// Write MeaningId[] → editor
		this.#cmEditor.setValue(ids.join("\n"));
	}

	async persistFromEditor(options: NormalizationOptions): Promise<void> {
		// Persist editor → settings
		const ids = new Set(this.readEditorMeaningIds(options));
		this.#plugin.settings.meaningSpecs = this.#plugin.settings.meaningSpecs.filter(spec =>
			ids.has(spec.id),
		);
		await this.#plugin.saveSettings();
	}

	splitLines(text: string): string[] {
		return text
			.split(/\r?\n/g)
			.map(s => s.trim())
			.filter(Boolean);
	}

	uniquePreserveOrder(xs: MeaningId[]): MeaningId[] {
		const seen = new Set<MeaningId>();
		const out: MeaningId[] = [];
		for (const x of xs) {
			if (seen.has(x)) {
				continue;
			}
			seen.add(x);
			out.push(x);
		}
		return out;
	}

	findSpecIndex(id: MeaningId, options: NormalizationOptions): number {
		const next = normalizeMeaningId(id, options);
		if (!next) {
			new Notice("Invalid meaning id.");
			return -1;
		}

		return this.#plugin.settings.meaningSpecs.findIndex(spec => spec.id === next);
	}
}
