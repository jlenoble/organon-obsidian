import "obsidian"; // important, so TypeScript merges declarations
import type { DataviewApi } from "obsidian-dataview";

declare module "obsidian" {
  interface App {
    plugins?: {
      plugins?: {
        ["dataview"]?: { api?: DataviewApi };
        ["obsidian-tasks-plugin"]?: ObsidianTasks.TasksPlugin;
      };
    };
  }
}
