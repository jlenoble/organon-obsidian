import "obsidian-dataview";

declare module "obsidian-dataview" {
  interface DataviewApi {
    // === Add known members here ===

    /** Return all pages matching a query */
    pages(query?: string): any[];

    /** Return metadata for a page */
    page(path: string): Record<string, any> | null;

    /** Evaluate a Dataview query expression */
    evaluate(expression: string, context?: unknown): any;

    /** Return current page context */
    current(): Record<string, any> | null;

    /** Convert path or link to a Dataview link */
    fileLink(path: string): unknown;

    /** Execute a Dataview query directly */
    query(query: string): Promise<any>;
  }
}
