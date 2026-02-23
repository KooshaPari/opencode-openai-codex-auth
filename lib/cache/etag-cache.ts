import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { ETagCacheMetadata } from "../types.js";

export interface ETagCacheLoadResult<TMeta extends ETagCacheMetadata> {
	content: string | null;
	metadata: TMeta | null;
}

async function ensureParentDirectory(filePath: string): Promise<void> {
	await mkdir(dirname(filePath), { recursive: true });
}

export async function loadETagCache<TMeta extends ETagCacheMetadata>(
	cacheFile: string,
	metadataFile: string,
): Promise<ETagCacheLoadResult<TMeta>> {
	let content: string | null = null;
	let metadata: TMeta | null = null;

	try {
		content = await readFile(cacheFile, "utf8");
	} catch {
		content = null;
	}

	try {
		const raw = await readFile(metadataFile, "utf8");
		metadata = JSON.parse(raw) as TMeta;
	} catch {
		metadata = null;
	}

	return { content, metadata };
}

export async function writeETagCache<TMeta extends ETagCacheMetadata>(
	cacheFile: string,
	metadataFile: string,
	content: string,
	metadata: TMeta,
	options: { indent?: number | string } = {},
): Promise<void> {
	const { indent = 0 } = options;
	await ensureParentDirectory(cacheFile);
	await ensureParentDirectory(metadataFile);

	await writeFile(cacheFile, content, "utf8");
	await writeFile(metadataFile, JSON.stringify(metadata, null, indent), "utf8");
}

export function isCacheFresh(
	metadata: ETagCacheMetadata | null,
	ttlMs: number,
	now: number = Date.now(),
): boolean {
	if (!metadata?.lastChecked) {
		return false;
	}

	return (now - metadata.lastChecked) < ttlMs;
}

export function buildIfNoneMatchHeader(metadata: ETagCacheMetadata | null): Record<string, string> {
	if (!metadata?.etag) {
		return {};
	}

	return { "If-None-Match": metadata.etag };
}
