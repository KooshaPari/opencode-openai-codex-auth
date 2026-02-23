import { describe, it, expect, beforeEach } from 'vitest';
import { getProviderConfig, getProviderForModel } from '../lib/config.js';
import type { PluginConfig } from '../lib/types.js';

describe('Provider Configuration', () => {
  let pluginConfig: PluginConfig;

  beforeEach(() => {
    pluginConfig = {};
  });

  describe('getProviderConfig', () => {
    it('should return default configuration when no providers config', () => {
      const config = getProviderConfig(pluginConfig);

      expect(config.default).toBe('codex');
      expect(config.fallback).toBe('augment');
      expect(config.autoFallback).toBe(true);
      expect(config.priority).toEqual(['codex', 'augment', 'cursor']);
    });

    it('should use custom provider configuration', () => {
      pluginConfig.providers = {
        default: 'augment',
        fallback: 'cursor',
        autoFallback: false,
        priority: ['cursor', 'augment', 'codex'],
      };

      const config = getProviderConfig(pluginConfig);

      expect(config.default).toBe('augment');
      expect(config.fallback).toBe('cursor');
      expect(config.autoFallback).toBe(false);
      expect(config.priority).toEqual(['cursor', 'augment', 'codex']);
    });

    it('should merge provider-specific configs with defaults', () => {
      pluginConfig.providers = {
        codex: {
          baseUrl: 'https://custom.api.com',
          timeout: 60000,
        },
        augment: {
          executable: 'custom-augment',
          args: ['--verbose'],
        },
        cursor: {
          executable: 'custom-cursor',
          streaming: false,
        },
      };

      const config = getProviderConfig(pluginConfig);

      expect(config.codex.baseUrl).toBe('https://custom.api.com');
      expect(config.codex.timeout).toBe(60000);
      expect(config.codex.autoRefresh).toBe(true); // default preserved

      expect(config.augment.executable).toBe('custom-augment');
      expect(config.augment.args).toEqual(['--verbose']);
      expect(config.augment.cwd).toBe(process.cwd()); // default preserved

      expect(config.cursor.executable).toBe('custom-cursor');
      expect(config.cursor.streaming).toBe(false);
    });
  });

  describe('getProviderForModel', () => {
    it('should select codex for gpt-5 models', () => {
      const config = getProviderConfig(pluginConfig);
      const provider = getProviderForModel('gpt-5', config);
      expect(provider).toBe('codex');
    });

    it('should select codex for codex models', () => {
      const config = getProviderConfig(pluginConfig);
      const provider = getProviderForModel('gpt-5-codex', config);
      expect(provider).toBe('codex');
    });

    it('should use priority order for other models', () => {
      const config = getProviderConfig(pluginConfig);
      const provider = getProviderForModel('other-model', config);
      expect(provider).toBe('codex'); // first in priority
    });

    it('should respect custom priority order', () => {
      pluginConfig.providers = {
        priority: ['cursor', 'augment', 'codex'],
      };

      const config = getProviderConfig(pluginConfig);
      const provider = getProviderForModel('other-model', config);
      expect(provider).toBe('cursor'); // first in custom priority
    });

    it('should fallback to default provider', () => {
      pluginConfig.providers = {
        default: 'augment',
        priority: ['nonexistent-provider'],
      };

      const config = getProviderConfig(pluginConfig);
      const provider = getProviderForModel('other-model', config);
      expect(provider).toBe('augment'); // fallback to default
    });
  });

  describe('Provider Configuration Validation', () => {
    it('should handle invalid provider names gracefully', () => {
      pluginConfig.providers = {
        default: 'invalid' as any,
        fallback: 'also-invalid' as any,
      };

      // Should not throw and should use fallbacks
      const config = getProviderConfig(pluginConfig);
      expect(config.default).toBe('invalid');
      expect(config.fallback).toBe('also-invalid');
    });

    it('should preserve boolean defaults', () => {
      pluginConfig.providers = {
        codex: { autoRefresh: false },
        cursor: { streaming: false },
      };

      const config = getProviderConfig(pluginConfig);
      expect(config.codex.autoRefresh).toBe(false);
      expect(config.cursor.streaming).toBe(false);
      expect(config.augment.args).toEqual([]); // default preserved
    });
  });
});