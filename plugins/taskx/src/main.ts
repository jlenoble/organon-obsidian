import { Plugin } from "obsidian";
import type { DataviewApi, DataviewInlineApi } from "obsidian-dataview";

export default class TaskXPlugin extends Plugin {
  dvApi: DataviewApi | null;
  tasksPlugin: any | null;

  #dv: DataviewInlineApi | null;
  get dv(): DataviewInlineApi | null {
    return this.#dv;
  }
  set dv(dv: DataviewInlineApi) {
    this.#dv = dv;
  }

  async onload() {
    console.log("Loading TaskX...");

    // Wait for Dataview and Tasks to be available
    this.app.workspace.onLayoutReady(async () => {
      this.#dv = null;

      this.dvApi = this.getDataviewApi();
      this.tasksPlugin = this.getTasksPlugin();

      if (!this.dvApi) console.warn("Dataview plugin not found!");
      if (!this.tasksPlugin) console.warn("Tasks plugin not found!");

      console.log("TaskX initialized.");
    });
  }

  onunload() {
    console.log("Unloading TaskX...");
  }

  // --- helpers ------------------------------------------------------------

  private getDataviewApi(): DataviewApi | null {
    return (this.app as any).plugins.plugins["dataview"]?.api ?? null;
  }

  private getTasksPlugin(): any | null {
    return (this.app as any).plugins.plugins["obsidian-tasks-plugin"] ?? null;
  }

  // --- exposed API --------------------------------------------------------

  doThis() {
    this.dv.paragraph("Do this!");
  }

  doThat() {
    this.dv.paragraph("Do that!");
  }
}
