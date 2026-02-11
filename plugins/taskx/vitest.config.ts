/**
 * vitest.config.ts
 *
 * This config wires the TaskX test harness in a way that stays compatible with
 * Vitest's current direction: "projects" for multiple environments.
 *
 * We keep two explicit projects:
 * - node: default for core/pipeline and most unit tests
 * - jsdom: only for DOM-rendering tests
 *
 * Rationale:
 * - Vitest deprecated environmentMatchGlobs in favor of test.projects.
 * - Projects make environment selection explicit and stable.
 *
 * Notes:
 * - The `@` alias mirrors our tsconfig `@/* -> src/*` meaning.
 * - Test discovery is limited to the canonical `tests/` tree.
 */

import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
	"@": path.resolve(__dirname, "src"),
};

const commonTestConfig = {
	// Do not leak state between tests.
	restoreMocks: true,
	mockReset: true,
	clearMocks: true,
};

export default defineConfig({
	resolve: {
		alias,
	},
	test: {
		projects: [
			{
				resolve: { alias },
				test: {
					...commonTestConfig,
					name: "node",
					environment: "node",
					include: ["tests/**/*.{test,node.test}.{ts,tsx}"],
					exclude: ["tests/**/*.dom.test.{ts,tsx}"],
				},
			},
			{
				resolve: { alias },
				test: {
					...commonTestConfig,
					name: "jsdom",
					environment: "jsdom",
					include: ["tests/**/*.dom.test.{ts,tsx}"],
				},
			},
		],
	},
});
