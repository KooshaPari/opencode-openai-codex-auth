import { describe, it, expect } from 'vitest';
import { OpenAIAuthPlugin } from '../index.js';

describe('Plugin Exports', () => {
  it('should export OpenAIAuthPlugin as default', () => {
    expect(OpenAIAuthPlugin).toBeDefined();
    expect(typeof OpenAIAuthPlugin).toBe('function');
  });

  it('should be a valid plugin function', () => {
    // Plugin should be an async function that returns a plugin object
    expect(OpenAIAuthPlugin).toBeInstanceOf(Function);
  });

  it('should handle missing client gracefully', async () => {
    // Test that plugin doesn't crash with minimal input
    const result = await OpenAIAuthPlugin({
      client: {} as any,
      project: {} as any,
      directory: '/test',
      worktree: '/test',
      $: {} as any,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});