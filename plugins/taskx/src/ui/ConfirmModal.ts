import { type App, Modal } from "obsidian";

export type ConfirmModalOptions = {
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isDanger?: boolean; // styles confirm as warning
	onConfirm: () => void | Promise<void>;
};

export class ConfirmModal extends Modal {
	constructor(
		app: App,
		private opts: ConfirmModalOptions,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: this.opts.title ?? "Confirm" });
		contentEl.createEl("p", { text: this.opts.message });

		const buttons = contentEl.createDiv({ cls: "taskx-modal-buttons" });

		const cancelBtn = buttons.createEl("button", { text: this.opts.cancelText ?? "Cancel" });
		cancelBtn.onclick = (): void => this.close();

		const confirmBtn = buttons.createEl("button", {
			text: this.opts.confirmText ?? "OK",
		});
		if (this.opts.isDanger) {
			confirmBtn.addClass("mod-warning");
		} else {
			confirmBtn.addClass("mod-cta");
		}

		confirmBtn.onclick = async (): Promise<void> => {
			await this.opts.onConfirm();
			this.close();
		};

		// Keyboard: Enter confirms, Escape cancels
		this.scope.register([], "Enter", evt => {
			evt.preventDefault();
			confirmBtn.click();
		});
		this.scope.register([], "Escape", evt => {
			evt.preventDefault();
			this.close();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
