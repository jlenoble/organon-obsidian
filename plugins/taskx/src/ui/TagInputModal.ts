// src/ui/TagInputModal.ts
import { type App, Modal, Setting } from "obsidian";

export type TagInputModalOptions = {
	title?: string;
	description?: string;
	placeholder?: string;
	initialValue?: string;

	// Return an error message string to block submit, or null if ok
	validate?: (value: string) => string | null;

	onSubmit: (value: string) => void;
};

export class TagInputModal extends Modal {
	private value: string;
	private errorEl: HTMLElement | null = null;

	constructor(
		app: App,
		private opts: TagInputModalOptions,
	) {
		super(app);
		this.value = opts.initialValue ?? "";
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: this.opts.title ?? "New tag" });

		if (this.opts.description) {
			contentEl.createEl("p", { text: this.opts.description });
		}

		// Error line (hidden by default)
		this.errorEl = contentEl.createEl("div", { cls: "taskx-modal-error" });
		this.errorEl.hide();

		new Setting(contentEl)
			.setName("Tag")
			.setDesc(this.opts.placeholder ?? "e.g. #work")
			.addText(t => {
				t.setPlaceholder(this.opts.placeholder ?? "#work");
				t.setValue(this.value);

				// Focus & select content
				window.setTimeout(() => {
					t.inputEl.focus();
					t.inputEl.select();
				}, 0);

				t.onChange(v => {
					this.value = v;
					this.setError(null);
				});
			});

		const buttons = contentEl.createDiv({ cls: "taskx-modal-buttons" });

		const cancelBtn = buttons.createEl("button", { text: "Cancel" });
		cancelBtn.onclick = (): void => this.close();

		const okBtn = buttons.createEl("button", { text: "OK" });
		okBtn.addClass("mod-cta");
		okBtn.onclick = (): void => this.submit();

		// Enter submits, Esc cancels
		this.scope.register([], "Enter", evt => {
			evt.preventDefault();
			this.submit();
		});
		this.scope.register([], "Escape", evt => {
			evt.preventDefault();
			this.close();
		});
	}

	private submit(): void {
		const v = (this.value ?? "").trim();

		const err = this.opts.validate?.(v) ?? null;
		if (err) {
			this.setError(err);
			return;
		}

		this.opts.onSubmit(v);
		this.close();
	}

	private setError(message: string | null): void {
		if (!this.errorEl) {
			return;
		}
		if (!message) {
			this.errorEl.hide();
			this.errorEl.setText("");
			return;
		}
		this.errorEl.setText(message);
		this.errorEl.show();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
