import { Plugin } from "obsidian";
import type { DataviewApi, DataviewInlineApi } from "obsidian-dataview";

import {
	buildExtendedDecisionOptions,
	DECISION_VIEW_NAMES,
	decisionCell,
	type DecisionOptions,
	type ExtendedDecisionOptions,
} from "./decision";
import {
	compileResolver,
	DEFAULT_SETTINGS,
	TaskXSettingTab,
	type Resolver,
	type TaskXPluginSettings,
} from "./settings";
import {
	buildExtendedSummaryOptions,
	type ExtendedSummaryOptions,
	SUMMARY_NAMES,
	type SummaryOptions,
} from "./summary/summary-options";
import { summaryTable } from "./summary/summary-table";
import type { TaskXPluginInterface } from "./types/taskx-plugin";
import { isDataviewInlineApi, isTasksPlugin } from "./utils";

import "./styles.css";

export default class TaskXPlugin extends Plugin implements TaskXPluginInterface {
	settings: TaskXPluginSettings = { ...DEFAULT_SETTINGS };
	resolver: Resolver = {};

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

		await this.loadSettings();

		this.addSettingTab(new TaskXSettingTab(this.app, this));

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

	// --- settings ------------------------------------------------------------

	async loadSettings(): Promise<void> {
		const loaded = (await this.loadData()) as Partial<TaskXPluginSettings> | null;

		this.settings = {
			...this.settings,
			...loaded,
		};

		this.rebuildResolver();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.rebuildResolver();
	}

	private rebuildResolver(): void {
		this.resolver = compileResolver({});
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

		const extOptions: ExtendedSummaryOptions = buildExtendedSummaryOptions(
			options,
			this.dv,
			this.tasksPlugin,
		);

		switch (extOptions.name) {
			case "hello-world":
				this.dv.paragraph("Hello World!");
				break;

			case "table":
				summaryTable(extOptions);
				break;

			default:
				this.dv.paragraph(
					`Usage: taskx.summary({ name: ${SUMMARY_NAMES.map(t => '"' + t + '"').join(" | ")} });`,
				);
		}

		if (extOptions.tasksMissingIds.length) {
			this.dv.paragraph(`There are ${extOptions.tasksMissingIds.length} tasks without an ID`);
		}

		if (extOptions.tasksUsurpingIds.length) {
			this.dv.paragraph(
				`There are ${extOptions.tasksUsurpingIds.length} tasks sharing the same ID`,
			);
		}
	}

	decision(options: DecisionOptions = {}): void {
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

		const extOptions: ExtendedDecisionOptions = buildExtendedDecisionOptions(
			options,
			this.dv,
			this.tasksPlugin,
		);

		switch (extOptions.viewName) {
			case "cell":
				decisionCell(extOptions);
				break;

			default:
				this.dv.paragraph(
					`Usage: taskx.decision({ viewName: ${DECISION_VIEW_NAMES.map(t => '"' + t + '"').join(" | ")} });`,
				);
		}

		this.dv.paragraph(`There are ${extOptions.taskMap.size} tasks in total.`);
	}
}
