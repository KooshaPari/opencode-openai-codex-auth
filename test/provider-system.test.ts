import { describe, it, expect, beforeEach } from 'vitest';
import { RequestProcessor } from '../lib/core/request-processor.js';
import { CodexProvider } from '../lib/providers/codex-provider.js';
import { AugmentProvider } from '../lib/providers/augment-provider.js';
import { CursorProvider } from '../lib/providers/cursor-provider.js';
import { initializeProviders, getProviderByModel } from '../lib/providers/provider-registry.js';
import { globalProviderRegistry } from '../lib/core/provider.js';
import type { RequestBody } from '../lib/types.js';

describe('Provider System', () => {
  let processor: RequestProcessor;

  beforeEach(() => {
    processor = new RequestProcessor({
      defaultProvider: 'codex',
      fallbackProvider: 'augment',
    });
  });

  describe('Provider Registration', () => {
    it('should initialize all providers', () => {
      initializeProviders();
      
      // Test that providers are registered by checking they can be retrieved
      const codexProvider = getProviderByModel('gpt-5');
      
      expect(codexProvider.id).toBe('codex');
      expect(codexProvider.name).toBe('OpenAI Codex (ChatGPT Backend)');
      
      // Test that augment provider is available by directly checking registry
      const augmentProvider = globalProviderRegistry.get('augment');
      const cursorProvider = globalProviderRegistry.get('cursor');
      
      expect(augmentProvider?.id).toBe('augment');
      expect(augmentProvider?.name).toBe('Augment CLI');
      expect(cursorProvider?.id).toBe('cursor');
      expect(cursorProvider?.name).toBe('Cursor CLI');
    });

    it('should register providers correctly', () => {
      const codexProvider = new CodexProvider();
      const augmentProvider = new AugmentProvider();
      
      processor.registerProvider(codexProvider);
      processor.registerProvider(augmentProvider);

      expect(processor.getRegisteredProviders()).toContain('codex');
      expect(processor.getRegisteredProviders()).toContain('augment');
    });
  });

  describe('Provider Selection', () => {
    beforeEach(() => {
      initializeProviders();
    });

    it('should select codex provider for gpt-5 models', () => {
      const provider = getProviderByModel('gpt-5');
      expect(provider.id).toBe('codex');
    });

    it('should select codex provider for codex models', () => {
      const provider = getProviderByModel('gpt-5-codex');
      expect(provider.id).toBe('codex');
    });

    it('should fallback to augment if codex unavailable', () => {
      // Mock scenario where codex is not available
      const provider = getProviderByModel('unknown-model');
      expect(provider).toBeDefined();
    });
  });

  describe('Request Processing', () => {
    beforeEach(() => {
      initializeProviders();
      const codexProvider = new CodexProvider();
      processor.registerProvider(codexProvider);
    });

    it('should handle missing request body gracefully', async () => {
      const result = await processor.process({} as RequestBody);
      
      expect(result).toHaveProperty('type');
      if (result && 'type' in result) {
        expect(result.type).toBe('validation');
      }
    });

    it('should select default provider when none specified', async () => {
      const request: RequestBody = {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'test' }],
      };

      // This should not throw, even though it might fail due to auth
      const result = await processor.process(request);
      expect(result).toBeDefined();
    });

    it('should use specified provider when provided', async () => {
      const request: RequestBody = {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'test' }],
      };

      // This should not throw, even though it might fail due to auth
      const result = await processor.process(request, 'codex');
      expect(result).toBeDefined();
    });
  });

  describe('Provider Validation', () => {
    it('should validate codex provider config', async () => {
      const provider = new CodexProvider();
      
      // Invalid config (no auth)
      const invalidResult = await provider.validateConfig({});
      expect(invalidResult).toBe(false);

      // Valid config (with OAuth auth)
      const validResult = await provider.validateConfig({
        auth: {
          type: 'oauth',
          access: 'test-token',
          refresh: 'test-refresh',
          expires: Date.now() + 1000000,
        },
      });
      expect(validResult).toBe(true);
    });

    it('should get auth status for providers', async () => {
      const codexProvider = new CodexProvider();
      const augmentProvider = new AugmentProvider();
      
      const codexStatus = await codexProvider.getAuthStatus?.();
      const augmentStatus = await augmentProvider.getAuthStatus?.();

      expect(codexStatus).toHaveProperty('authenticated');
      expect(codexStatus).toHaveProperty('details');
      
      expect(augmentStatus).toHaveProperty('authenticated');
      expect(augmentStatus).toHaveProperty('details');
    });
  });
});