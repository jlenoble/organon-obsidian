import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	root: __dirname,
	plugins: [react()],
	build: {
		outDir: "dist",
		emptyOutDir: true,
		lib: {
			entry: path.resolve(__dirname, "src/main.ts"),
			formats: ["cjs"],
			fileName: () => "main.js", // JS output filename
		},
		rollupOptions: {
			external: ["obsidian", "@codemirror/state", "@codemirror/view"],
			output: {
				assetFileNames: assetInfo => {
					// Use assetInfo.names if available, fallback to name
					const names = assetInfo.names ?? (assetInfo.name ? [assetInfo.name] : []);
					if (names.some(n => n.endsWith(".css"))) {
						return "styles.css"; // CSS output filename
					}
					return names[0] ?? "[name].[ext]";
				},
			},
		},
		sourcemap: true,
		target: "es2022",
		cssCodeSplit: false, // all CSS in one file
	},
});
