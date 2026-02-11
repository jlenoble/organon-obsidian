/**
 * vitest.config.ts
 *
 * This config wires a minimal, deterministic test harness for TaskX.
 * We keep node as the default environment (core/pipeline tests), and switch
 * to jsdom only for tests that explicitly opt in via filename suffix.
 *
 * Notes:
 * - `*.dom.test.ts(x)` runs in jsdom for UI renderer tests.
 * - All other `*.test.ts(x)` runs in node by default.
 * - The `@` alias mirrors the existing tsconfig `@/* -> src/*` meaning.
 */

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	test: {
		// Default environment: pure logic and pipeline tests.
		environment: "node",

		// UI tests opt into DOM via filename convention.
		environmentMatchGlobs: [["**/*.dom.test.{ts,tsx}", "jsdom"]],

		// We keep discovery limited to our canonical tests/ tree.
		include: ["tests/**/*.{test,node.test,dom.test}.{ts,tsx}"],

		// Do not leak state between tests.
		restoreMocks: true,
		mockReset: true,
		clearMocks: true,
	},
});
