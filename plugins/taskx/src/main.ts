import { Plugin } from "obsidian";

export default class TaskXPlugin extends Plugin {
  async onload() {
    console.log("TaskX plugin loaded!!!");
  }

  onunload() {
    console.log("TaskX plugin unloaded!!!");
  }
}
