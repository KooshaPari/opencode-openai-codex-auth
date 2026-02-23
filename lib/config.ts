import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { PluginConfig } from "./types.js";

const CONFIG_PATH = join(homedir(), ".opencode", "openai-codex-auth-config.json");

/**
 * Default plugin configuration
 * CODEX_MODE is enabled by default for better Codex CLI parity
 */
const DEFAULT_CONFIG: PluginConfig = {
	codexMode: true,
};

/**
 * Load plugin configuration from ~/.opencode/openai-codex-auth-config.json
 * Falls back to defaults if file doesn't exist or is invalid
 *
 * @returns Plugin configuration
 */
export function loadPluginConfig(): PluginConfig {
	try {
		if (!existsSync(CONFIG_PATH)) {
			return DEFAULT_CONFIG;
		}

		const fileContent = readFileSync(CONFIG_PATH, "utf-8");
		const userConfig = JSON.parse(fileContent) as Partial<PluginConfig>;

		// Merge with defaults
		return {
			...DEFAULT_CONFIG,
			...userConfig,
		};
	} catch (error) {
		console.warn(
			`[openai-codex-plugin] Failed to load config from ${CONFIG_PATH}:`,
			(error as Error).message
		);
		return DEFAULT_CONFIG;
	}
}

/**
 * Get effective CODEX_MODE setting
 * Priority: environment variable > config file > default (true)
 *
 * @param pluginConfig - Plugin configuration from file
 * @returns True if CODEX_MODE should be enabled
 */
export function getCodexMode(pluginConfig: PluginConfig): boolean {
	// Environment variable takes precedence
	if (process.env.CODEX_MODE !== undefined) {
		return process.env.CODEX_MODE === "1";
	}

	// Use config setting (defaults to true)
	return pluginConfig.codexMode ?? true;
}

/**
 * Get provider configuration with defaults
 *
 * @param pluginConfig - Plugin configuration from file
 * @returns Provider configuration
 */
export function getProviderConfig(pluginConfig: PluginConfig) {
	const providerConfig = pluginConfig.providers || {};
	
	return {
		default: providerConfig.default || 'codex',
		fallback: providerConfig.fallback || 'augment',
		autoFallback: providerConfig.autoFallback !== false,
		priority: providerConfig.priority || ['codex', 'augment', 'cursor'],
		codex: {
			baseUrl: 'https://api.openai.com/v1',
			timeout: 30000,
			autoRefresh: true,
			...providerConfig.codex,
		},
		augment: {
			executable: 'augment',
			args: [],
			cwd: process.cwd(),
			env: {},
			...providerConfig.augment,
		},
		cursor: {
			executable: 'cursor',
			args: [],
			cwd: process.cwd(),
			env: {},
			streaming: true,
			...providerConfig.cursor,
		},
	};
}

/**
 * Get provider for specific model based on configuration
 *
 * @param model - Model name
 * @param providerConfig - Provider configuration
 * @returns Provider ID to use
 */
export function getProviderForModel(model: string, providerConfig: ReturnType<typeof getProviderConfig>) {
	// Model-based provider mapping
	if (model.includes('codex') || model.includes('gpt-5')) {
		return 'codex';
	}
	
	// Use priority order, but only return providers that exist
	for (const providerId of providerConfig.priority) {
		if (['codex', 'augment', 'cursor'].includes(providerId)) {
			return providerId;
		}
	}
	
	// Fallback to default if it's valid
	if (['codex', 'augment', 'cursor'].includes(providerConfig.default)) {
		return providerConfig.default;
	}
	
	// Final fallback to codex
	return 'codex';
}