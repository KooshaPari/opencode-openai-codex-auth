/**
 * OpenCode Codex Prompt Fetcher
 *
 * Fetches and caches the codex.txt system prompt from OpenCode's GitHub repository.
 * Uses ETag-based caching to efficiently track updates.
 */

import { join } from "node:path";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import type { ETagCacheMetadata } from "../types.js";
import {
	buildIfNoneMatchHeader,
	isCacheFresh,
	loadETagCache,
	writeETagCache,
} from "../cache/etag-cache.js";

const OPENCODE_CODEX_URL =
	"https://raw.githubusercontent.com/sst/opencode/main/packages/opencode/src/session/prompt/codex.txt";
const CACHE_DIR = join(homedir(), ".opencode", "cache");
const CACHE_FILE = join(CACHE_DIR, "opencode-codex.txt");
const CACHE_META_FILE = join(CACHE_DIR, "opencode-codex-meta.json");
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface OpenCodeCacheMeta extends ETagCacheMetadata {
	lastFetch?: string; // Legacy field for backwards compatibility
}

/**
 * Fetch OpenCode's codex.txt prompt with ETag-based caching
 * Uses HTTP conditional requests to efficiently check for updates
 *
 * Rate limit protection: Only checks GitHub if cache is older than 15 minutes
 * @returns The codex.txt content
 */
export async function getOpenCodeCodexPrompt(): Promise<string> {
	const { content: cachedContent, metadata } = await loadETagCache<OpenCodeCacheMeta>(
		CACHE_FILE,
		CACHE_META_FILE,
	);

	if (cachedContent && isCacheFresh(metadata, CACHE_TTL_MS)) {
		return cachedContent;
	}

	const headers = buildIfNoneMatchHeader(metadata);

	try {
		const response = await fetch(OPENCODE_CODEX_URL, { headers });

		if (response.status === 304 && cachedContent) {
			const updatedMeta: OpenCodeCacheMeta = {
				...(metadata ?? {}),
				lastChecked: Date.now(),
			};

			await writeETagCache(CACHE_FILE, CACHE_META_FILE, cachedContent, updatedMeta, { indent: 2 });
			return cachedContent;
		}

		if (response.ok) {
			const content = await response.text();
			const etag = response.headers.get("etag") || "";
			const newMeta: OpenCodeCacheMeta = {
				etag,
				lastFetch: new Date().toISOString(),
				lastChecked: Date.now(),
			};

			await writeETagCache(CACHE_FILE, CACHE_META_FILE, content, newMeta, { indent: 2 });
			return content;
		}

		if (cachedContent) {
			return cachedContent;
		}

		throw new Error(`Failed to fetch OpenCode codex.txt: ${response.status}`);
	} catch (error) {
		if (cachedContent) {
			return cachedContent;
		}

		throw new Error(
			`Failed to fetch OpenCode codex.txt and no cache available: ${error}`,
		);
	}
}

/**
 * Get first N characters of the cached OpenCode prompt for verification
 * @param chars Number of characters to get (default: 50)
 * @returns First N characters or null if not cached
 */
export async function getCachedPromptPrefix(chars = 50): Promise<string | null> {
	try {
		const content = await readFile(CACHE_FILE, "utf-8");
		return content.substring(0, chars);
	} catch {
		return null;
	}
}
