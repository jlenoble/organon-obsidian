import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const plugins = {
	import: importPlugin,
	"unused-imports": unusedImportsPlugin,
	prettier: prettierPlugin,
};

const pluginsTs = {
	"@typescript-eslint": tseslint.plugin,
};

const rules = {
	/* === General Style / Safety === */
	"no-var": "error",
	"prefer-const": "error",
	eqeqeq: ["error", "always"],
	curly: ["error", "all"],

	/* === Unused imports cleanup === */
	"unused-imports/no-unused-imports": "error",

	/* === Import hygiene === */
	"import/order": [
		"error",
		{
			groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]],
			"newlines-between": "always",
			alphabetize: { order: "asc", caseInsensitive: true },
		},
	],

	/* === Prettier integration === */
	"prettier/prettier": ["error"],
};

const rulesTs = {
	/* === Unused imports cleanup === */
	"no-unused-vars": "off",
	"@typescript-eslint/no-unused-vars": [
		"error",
		{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
	],

	/* === TypeScript strictness === */
	"@typescript-eslint/explicit-function-return-type": "error",
	"@typescript-eslint/no-explicit-any": "error",
	"@typescript-eslint/consistent-type-imports": [
		"error",
		{ prefer: "type-imports", fixStyle: "inline-type-imports" },
	],
};

const ignores = ["node_modules/**", "dist/**", "dist-types/**", ".rush/**", "temp/**"];

export default defineConfig(
	{
		// --- Typed linting for TypeScript in src ---
		files: ["src/**/*.ts", "src/**/*.tsx"],
		ignores,
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname,
				sourceType: "module",
				ecmaVersion: "latest",
			},
			globals: {
				window: "readonly", // for Obsidian DOM APIs
				document: "readonly",
				process: "readonly", // for Node APIs
			},
		},
		plugins: { ...plugins, ...pluginsTs },
		rules: { ...rules, ...rulesTs },
	},

	{
		// --- Non-typed linting for all other files ---
		files: ["**/*.js", "**/*.jsx", "**/*.cjs", "**/*.mjs", "**/*.ts", "**/*.tsx"],
		ignores,
		languageOptions: {
			parserOptions: {
				// no `project` here → disables type-aware linting
			},
		},
		plugins,
		rules,
	},
);
