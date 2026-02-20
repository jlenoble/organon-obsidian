/**
 * adapters/obsidian/local-debug-config.ts
 *
 * This adapter reads optional local-only debug overrides from a vault-relative
 * JSON file. It gives entry code a narrow, testable seam for machine-specific
 * settings without committing those values to repository defaults.
 *
 * Intent:
 * - Keep local debug override IO at the Obsidian adapter boundary.
 * - Fail safe: missing or invalid files must not break rendering.
 *
 * Non-goals:
 * - No policy logic or feed transformation.
 * - No persistence or mutation of local config values.
 */

import type { App } from "obsidian";

/** Vault-relative local config path used for machine-specific debug overrides. */
export const TASKX_LOCAL_DEBUG_CONFIG_PATH = "plugins/taskx/temp/taskx.local.json";

/**
 * Optional local debug settings loaded from the local override file.
 *
 * Notes:
 * - All fields are optional so partial local overrides remain valid.
 * - Unknown keys are ignored by parser logic.
 */
export interface TaskXLocalDebugConfig {
	enableDebugFeedMirror?: boolean;
	debugFeedMirrorPath?: string;
	enableDebugSubsetMode?: boolean;
	debugSubsetTag?: string;
}

type VaultAdapterLike = {
	exists?: (path: string) => Promise<boolean>;
	read?: (path: string) => Promise<string>;
};

/**
 * Load local debug overrides from a vault-relative JSON file.
 *
 * Returns null when the file does not exist, cannot be read, or contains
 * invalid JSON/object shape.
 */
export async function loadTaskXLocalDebugConfig(app: App): Promise<TaskXLocalDebugConfig | null> {
	const adapter = getVaultAdapter(app);
	if (!adapter?.read) {
		return null;
	}

	const exists = adapter.exists ? await adapter.exists(TASKX_LOCAL_DEBUG_CONFIG_PATH) : false;
	if (!exists) {
		return null;
	}

	try {
		const raw = await adapter.read(TASKX_LOCAL_DEBUG_CONFIG_PATH);
		return parseLocalDebugConfig(raw);
	} catch {
		return null;
	}
}

function getVaultAdapter(app: App): VaultAdapterLike | null {
	const maybeAdapter = (app as App & { vault?: { adapter?: unknown } }).vault?.adapter;
	if (!maybeAdapter) {
		return null;
	}
	return maybeAdapter as VaultAdapterLike;
}

function parseLocalDebugConfig(raw: string): TaskXLocalDebugConfig | null {
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== "object") {
			return null;
		}

		const obj = parsed as Record<string, unknown>;
		const enableDebugFeedMirror =
			typeof obj.enableDebugFeedMirror === "boolean" ? obj.enableDebugFeedMirror : undefined;
		const debugFeedMirrorPath =
			typeof obj.debugFeedMirrorPath === "string" ? obj.debugFeedMirrorPath : undefined;
		const enableDebugSubsetMode =
			typeof obj.enableDebugSubsetMode === "boolean" ? obj.enableDebugSubsetMode : undefined;
		const debugSubsetTag = typeof obj.debugSubsetTag === "string" ? obj.debugSubsetTag : undefined;

		return {
			enableDebugFeedMirror,
			debugFeedMirrorPath,
			enableDebugSubsetMode,
			debugSubsetTag,
		};
	} catch {
		return null;
	}
}
