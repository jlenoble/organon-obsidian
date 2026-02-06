import type { App } from "obsidian";
import { Modal, Notice, Setting } from "obsidian";

import { clamp0to5, defaultDimensions } from "../scoring";
import type { MeaningId, MeaningSpec, NormalizationOptions, TagLexicon } from "../settings";
import { defaultLexicon, normalize, normalizeList } from "../settings";
import { splitCsvOrLines, validateLocale, validateMeaningId } from "./helpers";
import { toggleButton } from "./toggle-button";

export type MeaningSpecModalMode =
	| { mode: "create"; initial?: Partial<MeaningSpec> }
	| { mode: "edit"; initial: MeaningSpec };

export type MeaningSpecModalOptions = {
	normalization: NormalizationOptions;

	// validate uniqueness against existing meanings
	isMeaningIdTaken?: (id: string) => boolean;

	onSubmit: (spec: MeaningSpec) => void | Promise<void>;
};

type TabId = "neutral" | string; // locale string

export class MeaningSpecModal extends Modal {
	private spec: MeaningSpec;
	private activeTab: TabId = "neutral";

	private tabsEl: HTMLElement | null = null;
	private bodyEl: HTMLElement | null = null;
	private errorEl: HTMLElement | null = null;

	// Neutral tab input caches
	private pendingLocale: string = "";

	constructor(
		app: App,
		private mode: MeaningSpecModalMode,
		private opts: MeaningSpecModalOptions,
	) {
		super(app);

		if (mode.mode === "edit") {
			// Work on a copy so Cancel doesn't mutate caller state
			this.spec = structuredClone(mode.initial) as MeaningSpec;
		} else {
			const initial = mode.initial ?? {};
			this.spec = {
				id: (initial.id ?? "meaning-" + Date.now()) as MeaningId,
				dimensions: initial.dimensions ?? defaultDimensions(),
				languages: (initial.languages ?? {}) as Record<Locale, TagLexicon>,
				neutralAliases: (initial.neutralAliases ?? []) as Tag[],
			};
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: this.mode.mode === "edit" ? "Edit meaning" : "Add meaning" });

		this.errorEl = contentEl.createEl("div", { cls: "taskx-modal-error" });
		this.errorEl.hide();

		this.tabsEl = contentEl.createDiv({ cls: "taskx-tabs" });
		this.bodyEl = contentEl.createDiv({ cls: "taskx-tab-content" });

		const footer = contentEl.createDiv({ cls: "taskx-modal-buttons" });

		const cancelBtn = footer.createEl("button", { text: "Cancel" });
		cancelBtn.onclick = (): void => this.close();

		const okBtn = footer.createEl("button", { text: "OK" });
		okBtn.addClass("mod-cta");
		okBtn.onclick = async (): Promise<void> => this.submit();

		// Enter / Escape
		this.scope.register([], "Enter", async evt => {
			evt.preventDefault();
			return this.submit();
		});
		this.scope.register([], "Escape", evt => {
			evt.preventDefault();
			this.close();
		});

		this.renderTabs();
		this.renderActiveTab();
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

	private getLocales(): string[] {
		return Object.keys(this.spec.languages ?? {});
	}

	private renderTabs(): void {
		if (!this.tabsEl) {
			return;
		}
		this.tabsEl.empty();

		const mk = (label: string, id: TabId): void => {
			const b = this.tabsEl!.createEl("button", { text: label });
			b.addClass("taskx-tab-btn");
			if (this.activeTab === id) {
				b.addClass("is-active");
			}
			b.onclick = (): void => {
				this.activeTab = id;
				this.setError(null);
				this.renderTabs();
				this.renderActiveTab();
			};
		};

		mk("Neutral", "neutral");

		for (const loc of this.getLocales()) {
			mk(loc, loc);
		}
	}

	private renderActiveTab(): void {
		if (!this.bodyEl) {
			return;
		}
		this.bodyEl.empty();
		this.setError(null);

		if (this.activeTab === "neutral") {
			this.renderNeutralTab(this.bodyEl);
		} else {
			this.renderLocaleTab(this.bodyEl, this.activeTab);
		}
	}

	private renderNeutralTab(host: HTMLElement): void {
		// id
		new Setting(host)
			.setName("Meaning id")
			.setDesc("Stable internal key (e.g. tic, routine).")
			.addText(t => {
				t.setValue(String(this.spec.id));
				t.onChange(v => {
					this.spec.id = v.trim() as MeaningId;
					this.setError(null);
				});
			});

		// dimensions (minimal numeric inputs)
		const dim = this.spec.dimensions;

		new Setting(host).setName("Gain").addText(t => {
			t.setValue(String(dim.gain ?? 0));
			t.onChange(v => {
				const n = Number(v);
				if (!Number.isFinite(n)) {
					return;
				}
				dim.gain = clamp0to5(n);
			});
		});
		new Setting(host).setName("Pressure").addText(t => {
			t.setValue(String(dim.pressure ?? 0));
			t.onChange(v => {
				const n = Number(v);
				if (!Number.isFinite(n)) {
					return;
				}
				dim.pressure = clamp0to5(n);
			});
		});
		new Setting(host).setName("Friction").addText(t => {
			t.setValue(String(dim.friction ?? 0));
			t.onChange(v => {
				const n = Number(v);
				if (!Number.isFinite(n)) {
					return;
				}
				dim.friction = clamp0to5(n);
			});
		});

		// isAuthority
		toggleButton({
			containerEl: host,
			name: "Tag is authoritative",
			description: "If enabled, tagged tasks are marked for B3.",
			initValue: !!this.spec.isAuthority,
			onChange: v => {
				this.spec.isAuthority = v;
			},
		});

		// neutral aliases
		new Setting(host)
			.setName("Neutral aliases")
			.setDesc("Accepted regardless of UI language. Comma or newline separated.")
			.addTextArea(t => {
				t.setValue((this.spec.neutralAliases ?? []).join(", "));
				t.onChange(v => {
					this.spec.neutralAliases = normalizeList(splitCsvOrLines(v), this.opts.normalization);
				});
			});

		host.createEl("hr");

		// add locale
		new Setting(host)
			.setName("Add locale")
			.setDesc('Create a locale tab (e.g. "fr", "en").')
			.addText(t => {
				t.setPlaceholder("fr");
				t.onChange(v => (this.pendingLocale = v.trim()));
			})
			.addButton(b => {
				b.setButtonText("Add").setCta();
				b.onClick(() => {
					const err = validateLocale(this.pendingLocale);
					if (err) {
						this.setError(err);
						return;
					}

					const loc = this.pendingLocale;
					if (this.spec.languages[loc as Locale]) {
						this.setError(`Locale "${loc}" already exists.`);
						return;
					}

					this.spec.languages[loc as Locale] = defaultLexicon(this.opts.normalization);
					this.pendingLocale = "";
					this.activeTab = loc;
					this.renderTabs();
					this.renderActiveTab();
				});
			});
	}

	private renderLocaleTab(host: HTMLElement, locale: string): void {
		const loc = locale as Locale;
		const lex = this.spec.languages[loc];

		if (!lex) {
			host.createEl("p", { text: `Missing locale "${locale}" (internal error).` });
			return;
		}

		// canonical
		new Setting(host)
			.setName("Canonical tag")
			.setDesc("Preferred output for this locale.")
			.addText(t => {
				t.setValue(String(lex.canonical));
				t.onChange(v => {
					const n = normalize(v, this.opts.normalization);
					if (!n) {
						return;
					}
					lex.canonical = n as Tag;
				});
			});

		// aliases
		new Setting(host)
			.setName("Aliases")
			.setDesc("Accepted for this locale. Comma or newline separated.")
			.addTextArea(t => {
				t.setValue((lex.aliases ?? []).join(", "));
				t.onChange(v => {
					lex.aliases = normalizeList(splitCsvOrLines(v), this.opts.normalization);
				});
			});

		// optional i18n keys (keep minimal)
		new Setting(host).setName("labelKey").addText(t => {
			t.setValue(lex.labelKey ?? "");
			t.onChange(v => (lex.labelKey = v.trim()));
		});

		new Setting(host).setName("descriptionKey").addText(t => {
			t.setValue(lex.descriptionKey ?? "");
			t.onChange(v => (lex.descriptionKey = v.trim()));
		});

		host.createEl("hr");

		// remove locale
		new Setting(host)
			.setName("Remove locale")
			.setDesc("Deletes this locale tab.")
			.addButton(b => {
				b.setButtonText("Remove").setWarning();
				b.onClick(() => {
					delete this.spec.languages[loc];
					this.activeTab = "neutral";
					this.renderTabs();
					this.renderActiveTab();
				});
			});
	}

	private async submit(): Promise<void> {
		// Validate id
		const idStr = String(this.spec.id).trim();
		const idErr = validateMeaningId(idStr);
		if (idErr) {
			this.setError(idErr);
			return;
		}

		// Uniqueness check (optional)
		if (this.opts.isMeaningIdTaken?.(idStr)) {
			// In edit mode you’ll pass a predicate that ignores current one.
			this.setError(`Meaning id "${idStr}" already exists.`);
			return;
		}

		// Basic tag sanity: canonical tags must be valid
		for (const [loc, lex] of Object.entries(this.spec.languages)) {
			const canon = normalize(String(lex.canonical), this.opts.normalization);
			if (!canon) {
				this.setError(`Invalid canonical tag for locale "${loc}".`);
				return;
			}
			lex.canonical = canon as Tag;
			lex.aliases = (lex.aliases ?? []).filter(Boolean);
		}

		// Normalize neutral aliases
		this.spec.neutralAliases = normalizeList(
			this.spec.neutralAliases ?? [],
			this.opts.normalization,
		);

		await this.opts.onSubmit(this.spec);
		new Notice("Saved.");
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
