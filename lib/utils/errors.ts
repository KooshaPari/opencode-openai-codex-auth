import { logError } from "../logger.js";

export interface AuthError {
	type: "network" | "api" | "validation" | "token";
	message: string;
	status?: number;
	originalError?: Error;
}

export interface CacheError {
	type: "network" | "filesystem" | "validation";
	message: string;
	originalError?: Error;
}

export function createAuthError(
	type: AuthError["type"],
	message: string,
	status?: number,
	originalError?: Error,
): AuthError {
	const error: AuthError = { type, message, status, originalError };
	logError(`[auth] ${type}: ${message}`, { status, originalError });
	return error;
}

export function createCacheError(
	type: CacheError["type"],
	message: string,
	originalError?: Error,
): CacheError {
	const error: CacheError = { type, message, originalError };
	logError(`[cache] ${type}: ${message}`, { originalError });
	return error;
}

export function isAuthError(error: unknown): error is AuthError {
	return typeof error === "object" && error !== null && "type" in error && "message" in error;
}

export function isCacheError(error: unknown): error is CacheError {
	return typeof error === "object" && error !== null && "type" in error && "message" in error;
}

export function handleNetworkError(
	error: unknown,
	context: string,
): AuthError | CacheError {
	if (error instanceof Error) {
		if (context === "auth") {
			return createAuthError("network", `${context}: ${error.message}`, undefined, error);
		}
		return createCacheError("network", `${context}: ${error.message}`, error);
	}

	const message = `Unknown network error in ${context}`;
	return context === "auth"
		? createAuthError("network", message)
		: createCacheError("network", message);
}

export function handleValidationError(
	field: string,
	value: unknown,
	expected: string,
): AuthError | CacheError {
	const message = `Invalid ${field}: expected ${expected}, got ${typeof value}`;
	return createAuthError("validation", message);
}