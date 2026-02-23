import type { RequestBody } from "../types.js";
import type { Provider, ProviderRequest, ProviderResult, ProviderContext } from "./provider.js";
import { logDebug, logError } from "../logger.js";
import { isProviderError } from "./provider.js";

export interface RequestProcessorConfig {
	defaultProvider?: string;
	providerConfigs?: Record<string, any>;
	fallbackProvider?: string;
}

export class RequestProcessor {
	private providers: Map<string, Provider> = new Map();
	private config: RequestProcessorConfig;

	constructor(config: RequestProcessorConfig = {}) {
		this.config = config;
	}

	registerProvider(provider: Provider): void {
		this.providers.set(provider.id, provider);
		logDebug(`Registered provider: ${provider.name} (${provider.id})`);
	}

	async process(request: RequestBody, providerId?: string): Promise<ProviderResult> {
		const selectedProvider = this.selectProvider(providerId);
		if (!selectedProvider) {
			return {
				type: "validation",
				message: `Provider not found: ${providerId || "default"}`,
			};
		}

		const context: ProviderContext = {
			originalModel: request.model,
			userConfig: this.config.providerConfigs?.[selectedProvider.id] || {},
			providerConfig: this.config.providerConfigs?.[selectedProvider.id] || {},
		};

		const providerRequest: ProviderRequest = {
			body: { ...request },
			context,
		};

		logDebug(`Processing request with provider: ${selectedProvider.name}`, {
			providerId: selectedProvider.id,
			model: request.model,
		});

		try {
			const result = await selectedProvider.execute(providerRequest);
			
			if (isProviderError(result)) {
				logError(`Provider ${selectedProvider.name} failed:`, result);
				
				// Try fallback provider if configured
				if (this.config.fallbackProvider && selectedProvider.id !== this.config.fallbackProvider) {
					logDebug(`Attempting fallback to ${this.config.fallbackProvider}`);
					return this.process(request, this.config.fallbackProvider);
				}
			}

			return result;
		} catch (error) {
			const errorResult = {
				type: "process" as const,
				message: `Unexpected error from ${selectedProvider.name}: ${error instanceof Error ? error.message : String(error)}`,
				originalError: error instanceof Error ? error : new Error(String(error)),
			};
			
			logError(`Provider ${selectedProvider.name} threw error:`, errorResult);
			return errorResult;
		}
	}

	private selectProvider(providerId?: string): Provider | undefined {
		if (providerId) {
			return this.providers.get(providerId);
		}

		// Use default provider
		if (this.config.defaultProvider) {
			return this.providers.get(this.config.defaultProvider);
		}

		// Fallback to first registered provider
		const providers = Array.from(this.providers.values());
		return providers.length > 0 ? providers[0] : undefined;
	}

	getRegisteredProviders(): string[] {
		return Array.from(this.providers.keys());
	}

	getProviderInfo(providerId: string): { name: string; id: string } | undefined {
		const provider = this.providers.get(providerId);
		return provider ? { name: provider.name, id: provider.id } : undefined;
	}
}