/**
 * eslint.config.mjs
 *
 * This file defines the linting contract for the TaskX codebase using ESLint's
 * flat config format.
 *
 * We intentionally split linting into three tiers:
 *
 * 1) src/ (type-aware TypeScript linting)
 *    - Uses the TypeScript parser with a project reference.
 *    - Enforces both general rules and TS-specific rules.
 *    - This is the strictest and slowest tier, reserved for production code.
 *
 * 2) tests/ (TypeScript syntax, no type-aware project)
 *    - Uses the TypeScript parser, but without `project`.
 *    - This allows modern TS syntax (e.g. `import type`) in tests.
 *    - Keeps linting fast and avoids coupling tests to the main tsconfig.
 *
 * 3) everything else (lightweight JavaScript linting)
 *    - Uses the default JS parser.
 *    - Enforces only general, non-type-aware rules.
 *
 * Rationale:
 * - We want strict guarantees in src/.
 * - We want correct TS parsing in tests without the cost and fragility of
 *   project-wide type analysis.
 * - We want a cheap, safe baseline for config files, scripts, etc.
 */

import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

/**
 * Global ignore patterns shared by all configs.
 * These paths are never linted, regardless of rule set.
 */
const ignores = ["node_modules/**", "dist/**", "dist-types/**", ".rush/**", "temp/**"];

/* === Plugins === */

/**
 * Plugins that apply to both JS and TS code.
 */
const plugins = {
	import: importPlugin,
	"unused-imports": unusedImportsPlugin,
	prettier: prettierPlugin,
};

/**
 * Plugins that only make sense when the TypeScript parser is active.
 */
const pluginsTs = {
	"@typescript-eslint": tseslint.plugin,
};

/* === Shared Rules === */

/**
 * Rules that apply to all code, regardless of language.
 * These enforce baseline style, safety, and hygiene.
 */
const rules = {
	// --- General style/safety ---
	"no-var": "error",
	"prefer-const": "error",
	eqeqeq: ["error", "always"],
	curly: ["error", "all"],

	// --- Unused imports cleanup ---
	"unused-imports/no-unused-imports": "error",

	// --- Import hygiene ---
	"import/order": [
		"error",
		{
			groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]],
			"newlines-between": "always",
			alphabetize: { order: "asc", caseInsensitive: true },
		},
	],

	// --- Prettier integration ---
	"prettier/prettier": ["error"],
};

/* === TypeScript-specific rules === */

/**
 * Rules that only apply when linting TypeScript with the TS parser.
 * These focus on type-safety, explicitness, and consistency.
 */
const rulesTs = {
	// Disable the base rule in favor of the TS-aware one.
	"no-unused-vars": "off",

	"@typescript-eslint/no-unused-vars": [
		"error",
		{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
	],

	"@typescript-eslint/explicit-function-return-type": "error",
	"@typescript-eslint/no-explicit-any": "error",

	"@typescript-eslint/consistent-type-imports": [
		"error",
		{ prefer: "type-imports", fixStyle: "inline-type-imports" },
	],
};

/* === Export flat config === */

export default defineConfig(
	// -------------------------------------------------------------------------
	// 1) Type-aware linting for src/
	// -------------------------------------------------------------------------
	{
		files: ["src/**/*.ts", "src/**/*.tsx"],
		ignores,
		languageOptions: {
			// We use the TypeScript parser with a project reference here.
			// This enables type-aware linting rules.
			parser: tseslint.parser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname,
				sourceType: "module",
				ecmaVersion: "latest",
				ecmaFeatures: { jsx: true },
			},
			globals: {
				window: "readonly",
				document: "readonly",
				process: "readonly",
			},
		},
		plugins: { ...plugins, ...pluginsTs },
		rules: { ...rules, ...rulesTs },
	},

	// -------------------------------------------------------------------------
	// 2) Test linting (TypeScript syntax, no type-aware project)
	// -------------------------------------------------------------------------
	{
		files: ["tests/**/*.ts", "tests/**/*.tsx"],
		ignores,
		languageOptions: {
			// We still use the TypeScript parser so that TS syntax such as
			// `import type { ... }` is accepted.
			//
			// We intentionally do NOT set `project` here:
			// - Keeps linting fast.
			// - Avoids coupling tests to the main tsconfig.
			// - Prevents fragile cross-project type resolution issues.
			parser: tseslint.parser,
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
				sourceType: "module",
				ecmaVersion: "latest",
				ecmaFeatures: { jsx: true },
			},
		},
		plugins: { ...plugins, ...pluginsTs },
		rules: { ...rules, ...rulesTs },
	},

	// -------------------------------------------------------------------------
	// 3) Lightweight linting for everything else (no TS parser, no type analysis)
	// -------------------------------------------------------------------------
	{
		files: ["**/*.{js,jsx,cjs,mjs,ts,tsx}"],
		ignores,
		languageOptions: {
			// Default JS parser is sufficient here.
			parserOptions: {
				sourceType: "module",
				ecmaVersion: "latest",
				ecmaFeatures: { jsx: true },
			},
		},
		plugins,
		rules,
	},
);
