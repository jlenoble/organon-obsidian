import { type TaskXDisposable } from "../utils";
import { CodeMirrorListEditor } from "./CodeMirrorListEditor";

export interface TagEditorOptions {
	containerEl: HTMLElement;
	initValue: string;
	onChange(value: string): void;
}

export class TagEditor implements TaskXDisposable {
	#cmEditor: CodeMirrorListEditor;

	constructor({ containerEl, initValue, onChange }: TagEditorOptions) {
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
		});

		// Buttons
		const addBtn = right.createEl("button", { text: "Add" });
		addBtn.addClass("mod-cta");
		addBtn.onclick = async (): Promise<void> => {
			console.log("add");
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
}
