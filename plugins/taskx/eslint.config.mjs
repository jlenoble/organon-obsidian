import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const ignores = ["node_modules/**", "dist/**", "dist-types/**", ".rush/**", "temp/**"];

/* === Plugins === */
const plugins = {
	import: importPlugin,
	"unused-imports": unusedImportsPlugin,
	prettier: prettierPlugin,
};

const pluginsTs = {
	"@typescript-eslint": tseslint.plugin,
};

/* === Shared Rules === */
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
const rulesTs = {
	"no-unused-vars": "off", // disable base rule
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
	// --- Type-aware linting for src ---
	{
		files: ["src/**/*.ts", "src/**/*.tsx"],
		ignores,
		languageOptions: {
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

	// --- Lightweight linting for everything else (no type analysis) ---
	{
		files: ["**/*.{js,jsx,cjs,mjs,ts,tsx}"],
		ignores,
		languageOptions: {
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
