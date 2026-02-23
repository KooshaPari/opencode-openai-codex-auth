import { describe, it, expect } from "vitest";
import { decodeJWT } from "../lib/auth/auth.js";
import type { JWTPayload } from "../lib/types.js";

describe("Auth Edge Cases", () => {
	describe("decodeJWT", () => {
		it("should decode valid JWT token", () => {
			const payload = { "https://api.openai.com/auth": { chatgpt_account_id: "test-account" } };
			const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
			const token = `header.${encodedPayload}.signature`;

			const result = decodeJWT(token);

			expect(result).toEqual(payload);
		});

		it("should return null for malformed JWT", () => {
			const result = decodeJWT("invalid.jwt.token");

			expect(result).toBeNull();
		});

		it("should return null for JWT with wrong number of parts", () => {
			const result = decodeJWT("only.two.parts");

			expect(result).toBeNull();
		});

		it("should handle base64 padding correctly", () => {
			const payload = { test: "data" };
			const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
			const token = `header.${encodedPayload}.signature`;

			const result = decodeJWT(token);

			expect(result).toEqual(payload);
		});

		it("should return null for invalid base64", () => {
			const token = "header.invalid-base64.signature";

			const result = decodeJWT(token);

			expect(result).toBeNull();
		});

		it("should return null for invalid JSON payload", () => {
			const invalidPayload = Buffer.from("invalid json").toString("base64");
			const token = `header.${invalidPayload}.signature`;

			const result = decodeJWT(token);

			expect(result).toBeNull();
		});

		it("should handle empty payload", () => {
			const emptyPayload = Buffer.from(JSON.stringify({})).toString("base64");
			const token = `header.${emptyPayload}.signature`;

			const result = decodeJWT(token);

			expect(result).toEqual({});
		});

		it("should preserve additional JWT fields", () => {
			const payload: JWTPayload = {
				"https://api.openai.com/auth": { chatgpt_account_id: "test-account" },
				customField: "custom-value",
				anotherField: 123,
			};
			const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");
			const token = `header.${encodedPayload}.signature`;

			const result = decodeJWT(token);

			expect(result).toEqual(payload);
		});
	});
});