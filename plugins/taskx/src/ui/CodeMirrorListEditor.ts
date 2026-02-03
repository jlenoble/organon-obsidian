import { defaultKeymap } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, highlightActiveLine } from "@codemirror/view";

import { type TaskXDisposable } from "../utils";

export type CodeMirrorListEditorOptions = {
	containerEl: HTMLElement;
	initValue: string;
	placeholder?: string;
	onChange?: (value: string) => void;
	readOnly?: boolean;
};

export class CodeMirrorListEditor implements TaskXDisposable {
	private view: EditorView;

	constructor(opts: CodeMirrorListEditorOptions) {
		const extensions = [
			keymap.of(defaultKeymap),
			EditorState.readOnly.of(!!opts.readOnly),
			EditorView.editable.of(!opts.readOnly),
			EditorView.lineWrapping,
			highlightActiveLine(),
			EditorView.updateListener.of(u => {
				if (u.docChanged) {
					opts.onChange?.(u.state.doc.toString());
				}
			}),
			// Optional placeholder (minimal)
			EditorView.contentAttributes.of({
				"aria-label": opts.placeholder ?? "List editor",
			}),
			EditorView.theme({
				"&": {
					border: "1px solid var(--background-modifier-border)",
					borderRadius: "8px",
					backgroundColor: "var(--background-primary)",
				},
				".cm-content": {
					padding: "8px 10px",
					fontFamily: "var(--font-text)",
					fontSize: "var(--font-text-size)",
				},
				".cm-activeLine": {
					backgroundColor: "color-mix(in srgb, var(--interactive-accent) 18%, transparent)",
				},
				".cm-scroller": {
					overflow: "auto",
					maxHeight: "240px",
				},
			}),
		];

		const state = EditorState.create({
			doc: opts.initValue,
			extensions,
		});

		this.view = new EditorView({
			state,
			parent: opts.containerEl,
		});
	}

	dispose(): void {
		console.warn("Destroying list editor");
		this.view.destroy();
	}

	getValue(): string {
		return this.view.state.doc.toString();
	}

	setValue(next: string): void {
		const cur = this.getValue();
		if (cur === next) {
			return;
		}
		this.view.dispatch({
			changes: { from: 0, to: this.view.state.doc.length, insert: next },
		});
	}

	/** Return the trimmed line containing the cursor */
	getSelectedLine(): string | null {
		const sel = this.view.state.selection.main;
		const line = this.view.state.doc.lineAt(sel.head);
		const trimmed = line.text.trim();
		return trimmed.length ? trimmed : null;
	}

	focus(): void {
		this.view.focus();
	}
}
