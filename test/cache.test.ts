import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
	loadETagCache,
	writeETagCache,
	isCacheFresh,
	buildIfNoneMatchHeader,
} from "../lib/cache/etag-cache.js";

describe("ETag Cache Utility", () => {
	const tempDir = join(tmpdir(), "etag-cache-test");
	const cacheFile = join(tempDir, "test-cache.txt");
	const metaFile = join(tempDir, "test-cache-meta.json");

	beforeEach(() => {
		mkdirSync(tempDir, { recursive: true });
		writeFileSync(cacheFile, "test content", "utf8");
	});

	afterEach(() => {
		try {
			rmSync(tempDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("loadETagCache", () => {
		it("should load existing cache and metadata", async () => {
			const metadata = { etag: "test-etag", lastChecked: Date.now() };
			writeFileSync(metaFile, JSON.stringify(metadata), "utf8");

			const result = await loadETagCache(cacheFile, metaFile);

			expect(result.content).toBe("test content");
			expect(result.metadata).toEqual(metadata);
		});

		it("should return null for missing cache", async () => {
			const result = await loadETagCache("/nonexistent/cache.txt", metaFile);

			expect(result.content).toBeNull();
		});

		it("should return null for corrupted metadata", async () => {
			writeFileSync(metaFile, "invalid json", "utf8");

			const result = await loadETagCache(cacheFile, metaFile);

			expect(result.content).toBe("test content");
			expect(result.metadata).toBeNull();
		});
	});

	describe("writeETagCache", () => {
		it("should write cache and metadata", async () => {
			const content = "new content";
			const metadata = { etag: "new-etag", lastChecked: Date.now() };

			await writeETagCache(cacheFile, metaFile, content, metadata);

			const result = await loadETagCache(cacheFile, metaFile);
			expect(result.content).toBe(content);
			expect(result.metadata).toEqual(metadata);
		});

		it("should create parent directories if needed", async () => {
			const nestedCacheFile = join(tempDir, "nested", "cache.txt");
			const nestedMetaFile = join(tempDir, "nested", "meta.json");

			await writeETagCache(nestedCacheFile, nestedMetaFile, "content", { lastChecked: Date.now() });

			const result = await loadETagCache(nestedCacheFile, nestedMetaFile);
			expect(result.content).toBe("content");
		});
	});

	describe("isCacheFresh", () => {
		it("should return true for fresh cache", () => {
			const now = Date.now();
			const metadata = { lastChecked: now - 1000 }; // 1 second ago

			expect(isCacheFresh(metadata, 15000, now)).toBe(true);
		});

		it("should return false for stale cache", () => {
			const now = Date.now();
			const metadata = { lastChecked: now - 20000 }; // 20 seconds ago

			expect(isCacheFresh(metadata, 15000, now)).toBe(false);
		});

		it("should return false for missing timestamp", () => {
			const metadata = { etag: "test" };

			expect(isCacheFresh(metadata, 15000)).toBe(false);
		});

		it("should return false for null metadata", () => {
			expect(isCacheFresh(null, 15000)).toBe(false);
		});
	});

	describe("buildIfNoneMatchHeader", () => {
		it("should build header with etag", () => {
			const metadata = { etag: "test-etag" };

			const header = buildIfNoneMatchHeader(metadata);

			expect(header).toEqual({ "If-None-Match": "test-etag" });
		});

		it("should return empty object for null etag", () => {
			const metadata = { etag: null };

			const header = buildIfNoneMatchHeader(metadata);

			expect(header).toEqual({});
		});

		it("should return empty object for missing etag", () => {
			const metadata = { lastChecked: Date.now() };

			const header = buildIfNoneMatchHeader(metadata);

			expect(header).toEqual({});
		});

		it("should return empty object for null metadata", () => {
			const header = buildIfNoneMatchHeader(null);

			expect(header).toEqual({});
		});
	});
});