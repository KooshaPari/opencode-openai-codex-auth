import { globalProviderRegistry } from '../core/provider.js';
import { CodexProvider } from './codex-provider.js';
import { AugmentProvider } from './augment-provider.js';
import { CursorProvider } from './cursor-provider.js';
import { logDebug } from '../logger.js';
import { getProviderConfig } from '../config.js';
import { loadPluginConfig } from '../config.js';

/**
 * Initialize and register all available providers
 */
export function initializeProviders(): void {
  logDebug('Initializing providers...');

  // Register Codex provider
  const codexProvider = new CodexProvider();
  globalProviderRegistry.register(codexProvider);
  logDebug(`Registered provider: ${codexProvider.name}`);

  // Register Augment provider
  const augmentProvider = new AugmentProvider();
  globalProviderRegistry.register(augmentProvider);
  logDebug(`Registered provider: ${augmentProvider.name}`);

  // Register Cursor provider
  const cursorProvider = new CursorProvider();
  globalProviderRegistry.register(cursorProvider);
  logDebug(`Registered provider: ${cursorProvider.name}`);

  logDebug(`Total providers registered: ${globalProviderRegistry.list().length}`);
}

/**
 * Get provider by model name
 * Determines best provider for a given model based on configuration
 */
export function getProviderByModel(model: string) {
  const pluginConfig = loadPluginConfig();
  const providerConfig = getProviderConfig(pluginConfig);
  
  // Use configured priority order
  for (const providerId of providerConfig.priority) {
    const provider = globalProviderRegistry.get(providerId);
    if (provider) {
      return provider;
    }
  }
  
  // Fallback to first available provider
  const providers = globalProviderRegistry.list();
  return providers[0];
}

/**
 * Get provider by model name
 * Determines the best provider for a given model
 */
export function getProviderForModel(model: string) {
  const providers = globalProviderRegistry.list();
  
  // Priority order: Codex -> Augment -> Cursor
  const providerPriority = ['codex', 'augment', 'cursor'];
  
  for (const providerId of providerPriority) {
    const provider = globalProviderRegistry.get(providerId);
    if (provider) {
      // For now, assume all providers support all models
      // In the future, each provider can implement model-specific logic
      return provider;
    }
  }
  
  // Fallback to first available provider
  return providers[0];
}

/**
 * Get all available providers with their status
 */
export async function getProviderStatuses() {
  const providers = globalProviderRegistry.list();
  const statuses = await Promise.all(
    providers.map(async (provider) => {
      const authStatus = await provider.getAuthStatus?.();
      return {
        id: provider.id,
        name: provider.name,
        authenticated: authStatus?.authenticated ?? false,
        details: authStatus?.details,
      };
    })
  );
  
  return statuses;
}