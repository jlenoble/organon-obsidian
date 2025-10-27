import { Plugin } from "obsidian";
import type { DataviewApi, DataviewInlineApi } from "obsidian-dataview";

import { isDataviewInlineApi, isTasksPlugin } from "./guards";
import { defaultSummaryOptions, SUMMARY_NAMES, type SummaryOptions } from "./summary-options";
import { table } from "./table";
import { tree } from "./tree";

import "primereact/resources/themes/lara-dark-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import "./styles.css";

export default class TaskXPlugin extends Plugin {
	dvApi: DataviewApi | null = null;
	tasksPlugin: TasksPlugin | null = null;

	#dv: DataviewInlineApi | null = null;
	get dv(): DataviewInlineApi | null {
		return this.#dv;
	}
	set dv(dv: DataviewInlineApi) {
		this.#dv = dv;
	}

	async onload(): Promise<void> {
		console.log("Loading TaskX...");

		// Wait for Dataview and Tasks to be available
		this.app.workspace.onLayoutReady(async () => {
			this.#dv = null;

			this.dvApi = this.getDataviewApi();
			this.tasksPlugin = this.getTasksPlugin();

			if (!this.dvApi) {
				console.warn("Dataview plugin not found!");
			}
			if (!this.tasksPlugin) {
				console.warn("Tasks plugin not found!");
			}

			console.log("TaskX initialized.");
		});
	}

	onunload(): void {
		console.log("Unloading TaskX...");
	}

	// --- helpers ------------------------------------------------------------

	private getDataviewApi(): DataviewApi | null {
		return this.app.plugins?.plugins?.["dataview"]?.api ?? null;
	}

	private getTasksPlugin(): TasksPlugin | null {
		return this.app.plugins?.plugins?.["obsidian-tasks-plugin"] ?? null;
	}

	// --- exposed API --------------------------------------------------------

	summary(options: SummaryOptions = {}): void {
		if (!isTasksPlugin(this.tasksPlugin)) {
			console.warn("Tasks plugin not loaded before TaskX");
			return;
		}

		// this.dv is expected to have been set up at the top of any calling block
		// with the simple line: taskx.dv = dv
		if (!isDataviewInlineApi(this.dv)) {
			console.warn("Dataview inline API not set in TaskX");
			return;
		}

		const extOptions = {
			...defaultSummaryOptions,
			tasksPlugin: this.tasksPlugin,
			dv: this.dv,
			...options,
		};

		switch (extOptions.name) {
			case "hello-world":
				this.dv.paragraph("Hello World!");
				break;

			case "table":
				table(extOptions);
				break;

			case "tree":
				tree(extOptions);
				break;

			default:
				this.dv.paragraph(
					`Usage: taskx.summary({ name: ${SUMMARY_NAMES.map(t => '"' + t + '"').join(" | ")} });`,
				);
		}
	}
}
