import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AugmentProvider } from '../lib/providers/augment-provider.js';
import { CursorProvider } from '../lib/providers/cursor-provider.js';
import { spawn } from 'node:child_process';
import type { ProviderRequest } from '../lib/core/provider.js';

// Mock spawn to avoid actual subprocess execution
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

describe('CLI Providers Basic Tests', () => {
  let mockSpawn: any;

  beforeEach(() => {
    mockSpawn = vi.mocked(spawn);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AugmentProvider', () => {
    let provider: AugmentProvider;

    beforeEach(() => {
      provider = new AugmentProvider();
    });

    it('should have correct provider metadata', () => {
      expect(provider.id).toBe('augment');
      expect(provider.name).toBe('Augment CLI');
    });

    it('should implement required methods', () => {
      expect(typeof provider.execute).toBe('function');
      expect(typeof provider.validateConfig).toBe('function');
      expect(typeof provider.getAuthStatus).toBe('function');
    });

    it('should handle empty request gracefully', async () => {
      // Mock spawn to return error for empty prompt
      const mockProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'error') callback(new Error('No prompt provided'));
        }),
        kill: vi.fn(),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const request: ProviderRequest = {
        body: {
          model: 'gpt-4',
          messages: [],
        },
        context: {
          userConfig: {},
          providerConfig: {
            executable: 'augment',
            args: [],
            cwd: process.cwd(),
            env: {},
          },
        },
      };

      // Should return an error result for empty messages
      const result = await provider.execute(request);
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('message');
    });
  });

  describe('CursorProvider', () => {
    let provider: CursorProvider;

    beforeEach(() => {
      provider = new CursorProvider();
    });

    it('should have correct provider metadata', () => {
      expect(provider.id).toBe('cursor');
      expect(provider.name).toBe('Cursor CLI');
    });

    it('should implement required methods', () => {
      expect(typeof provider.execute).toBe('function');
      expect(typeof provider.validateConfig).toBe('function');
      expect(typeof provider.getAuthStatus).toBe('function');
    });

    it('should handle empty request gracefully', async () => {
      // Mock spawn to return error for empty prompt
      const mockProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'error') callback(new Error('No prompt provided'));
        }),
        kill: vi.fn(),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const request: ProviderRequest = {
        body: {
          model: 'gpt-4',
          messages: [],
        },
        context: {
          userConfig: {},
          providerConfig: {
            executable: 'cursor',
            args: [],
            cwd: process.cwd(),
            env: {},
            streaming: true,
          },
        },
      };

      // Should return an error result for empty messages
      const result = await provider.execute(request);
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('message');
    });
  });

  describe('CLI Provider Configuration', () => {
    it('should handle missing executable in config', async () => {
      // Mock spawn to simulate missing executable
      const mockProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'error') callback(new Error('Command not found'));
        }),
        kill: vi.fn(),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const augmentProvider = new AugmentProvider();
      const cursorProvider = new CursorProvider();

      // Test with empty config
      const emptyConfig = {};

      const augmentValid = await augmentProvider.validateConfig?.(emptyConfig);
      const cursorValid = await cursorProvider.validateConfig?.(emptyConfig);

      // Should handle gracefully without throwing
      expect(typeof augmentValid).toBe('boolean');
      expect(typeof cursorValid).toBe('boolean');
    });

    it('should return auth status structure', async () => {
      const augmentProvider = new AugmentProvider();
      const cursorProvider = new CursorProvider();

      const augmentAuth = await augmentProvider.getAuthStatus?.();
      const cursorAuth = await cursorProvider.getAuthStatus?.();

      // Should return proper auth status structure
      expect(augmentAuth).toHaveProperty('authenticated');
      expect(augmentAuth).toHaveProperty('details');
      expect(cursorAuth).toHaveProperty('authenticated');
      expect(cursorAuth).toHaveProperty('details');

      // Values should be boolean or string
      expect(typeof augmentAuth?.authenticated).toBe('boolean');
      expect(typeof cursorAuth?.authenticated).toBe('boolean');
    });
  });
});