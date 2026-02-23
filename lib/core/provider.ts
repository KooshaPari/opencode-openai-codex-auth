import type { RequestBody } from "../types.js";

export interface ProviderContext {
	originalModel?: string;
	userConfig: any;
	providerConfig: any;
}

export interface ProviderRequest {
	body: RequestBody;
	context: ProviderContext;
}

export interface ProviderResponse {
	content: string;
	metadata?: Record<string, unknown>;
	isStreaming?: boolean;
}

export interface ProviderError {
	type: "auth" | "network" | "api" | "validation" | "process";
	message: string;
	code?: number | string;
	originalError?: Error;
}

export type ProviderResult = ProviderResponse | ProviderError;

export interface Provider {
	id: string;
	name: string;
	execute(request: ProviderRequest): Promise<ProviderResult>;
	validateConfig?(config: any): Promise<boolean>;
	getAuthStatus?(): Promise<{ authenticated: boolean; details?: string }>;
}

export interface ProviderRegistry {
	providers: Map<string, Provider>;
	register(provider: Provider): void;
	get(providerId: string): Provider | undefined;
	list(): Provider[];
}

export function isProviderError(result: ProviderResult): result is ProviderError {
	return typeof result === "object" && result !== null && "type" in result && "message" in result;
}

export function isProviderResponse(result: ProviderResult): result is ProviderResponse {
	return !isProviderError(result);
}

export class DefaultProviderRegistry implements ProviderRegistry {
	providers = new Map<string, Provider>();

	register(provider: Provider): void {
		this.providers.set(provider.id, provider);
	}

	get(providerId: string): Provider | undefined {
		return this.providers.get(providerId);
	}

	list(): Provider[] {
		return Array.from(this.providers.values());
	}
}

export const globalProviderRegistry = new DefaultProviderRegistry();