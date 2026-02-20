/**
 * adapters/obsidian/debug-feed-mirror.ts
 *
 * This adapter provides a narrow write boundary for the M1.4b debug mirror
 * loop. Entry code can hand us rendered feed text, and we persist it to a
 * vault-relative file path without leaking filesystem concerns into core or UI.
 *
 * Intent:
 * - Keep debug mirroring isolated at the Obsidian adapter boundary.
 * - Make mirror writes best-effort so render flows remain resilient.
 *
 * Non-goals:
 * - No ranking or recommendation policy logic.
 * - No UI rendering decisions.
 */

import type { App } from "obsidian";

type VaultAdapterLike = {
	exists?: (path: string) => Promise<boolean>;
	mkdir?: (path: string) => Promise<void>;
	write?: (path: string, data: string) => Promise<void>;
};

/**
 * Result shape for debug mirror write attempts.
 *
 * Notes:
 * - We return status instead of throwing so callers can keep rendering robust.
 * - `error` is preserved for diagnostics and tests when writes fail.
 */
export interface DebugFeedMirrorWriteResult {
	ok: boolean;
	error?: unknown;
}

/**
 * Persist rendered feed text to a vault-relative mirror file.
 *
 * The write is best-effort by contract: failures are reported in the return
 * value and never thrown.
 */
export async function writeDebugFeedMirror(params: {
	app: App;
	path: string;
	content: string;
}): Promise<DebugFeedMirrorWriteResult> {
	const adapter = getVaultAdapter(params.app);
	if (!adapter?.write) {
		return { ok: false, error: new Error("Vault adapter write API unavailable") };
	}

	try {
		await ensureParentDirectories(adapter, params.path);
		await adapter.write(params.path, sanitizeMirrorContent(params.content));
		return { ok: true };
	} catch (error) {
		return { ok: false, error };
	}
}

function getVaultAdapter(app: App): VaultAdapterLike | null {
	const maybeAdapter = (app as App & { vault?: { adapter?: unknown } }).vault?.adapter;
	if (!maybeAdapter) {
		return null;
	}
	return maybeAdapter as VaultAdapterLike;
}

async function ensureParentDirectories(
	adapter: VaultAdapterLike,
	targetPath: string,
): Promise<void> {
	if (!adapter.mkdir) {
		return;
	}

	const parent = getParentPath(targetPath);
	if (!parent) {
		return;
	}

	const parts = parent.split("/").filter(Boolean);
	let current = "";

	for (const part of parts) {
		current = current ? `${current}/${part}` : part;
		const alreadyExists = adapter.exists ? await adapter.exists(current) : false;
		if (alreadyExists) {
			continue;
		}
		try {
			await adapter.mkdir(current);
		} catch {
			// Ignore directory creation races or already-existing paths.
		}
	}
}

function getParentPath(path: string): string {
	const normalized = path.replace(/\\/g, "/").trim();
	const lastSlash = normalized.lastIndexOf("/");
	return lastSlash <= 0 ? "" : normalized.slice(0, lastSlash);
}

function sanitizeMirrorContent(content: string): string {
	const unixText = content.replace(/\r\n/g, "\n");
	return unixText.endsWith("\n") ? unixText : `${unixText}\n`;
}
