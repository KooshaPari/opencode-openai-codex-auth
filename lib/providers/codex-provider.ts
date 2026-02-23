import { Provider, ProviderRequest, ProviderResult, ProviderError, isProviderError } from '../core/provider.js';
import { transformRequestForCodex, createCodexHeaders, handleSuccessResponse, handleErrorResponse } from '../request/fetch-helpers.js';
import { getCodexInstructions } from '../prompts/codex.js';
import { loadPluginConfig } from '../config.js';
import { rewriteUrlForCodex } from '../request/fetch-helpers.js';
import { logError } from '../logger.js';
import type { Auth } from '@opencode-ai/sdk';

/**
 * Codex provider implementation using ChatGPT backend API
 */
export class CodexProvider implements Provider {
  readonly id = 'codex';
  readonly name = 'OpenAI Codex (ChatGPT Backend)';

  async execute(request: ProviderRequest): Promise<ProviderResult> {
    try {
      // Get auth from context
      const auth = request.context.providerConfig?.auth as Auth;
      if (!auth || auth.type !== 'oauth' || !auth.access) {
        return {
          type: 'auth',
          message: 'No valid OAuth token available',
        };
      }

      // Load configuration
      const pluginConfig = await loadPluginConfig();
      const codexInstructions = await getCodexInstructions();
      const codexMode = request.context.providerConfig?.codexMode ?? true;
      
      // Build user config from context
      const userConfig = {
        global: request.context.userConfig || {},
        models: request.context.providerConfig?.models || {},
      };

      // Transform request
      const transformed = await transformRequestForCodex(
        { body: JSON.stringify(request.body) },
        'https://api.openai.com/v1/chat/completions', // Dummy URL for transformation
        codexInstructions,
        userConfig,
        codexMode
      );

      if (!transformed) {
        return {
          type: 'validation',
          message: 'Failed to transform request body',
        };
      }

      // Rewrite URL for Codex backend
      const codexUrl = rewriteUrlForCodex('https://api.openai.com/v1/chat/completions');

      // Create headers
      const headers = createCodexHeaders(
        { method: 'POST', headers: {} },
        request.context.providerConfig?.accountId || '',
        auth.access
      );

      // Make request
      const response = await fetch(codexUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(transformed.body),
      });

      if (!response.ok) {
        const errorResponse = await handleErrorResponse(response);
        const errorText = await errorResponse.text();
        return {
          type: 'api',
          message: `Codex API error: ${response.status} ${errorText}`,
          code: response.status,
        };
      }

      // Handle successful response
      const finalResponse = await handleSuccessResponse(response, !!request.body.tools);
      const content = await finalResponse.text();

      return {
        content,
        metadata: {
          provider: 'codex',
          model: request.body.model,
          url: codexUrl,
        },
        isStreaming: !!request.body.tools,
      };

    } catch (error) {
      logError('Codex provider error:', error);
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        const errorType = this.getErrorType(message);
        
        return {
          type: errorType,
          message: error.message,
          originalError: error,
        };
      }

      return {
        type: 'process',
        message: 'Unknown error occurred',
        originalError: error as Error,
      };
    }
  }

  async validateConfig(config: any): Promise<boolean> {
    try {
      const auth = config?.auth as Auth;
      return auth?.type === 'oauth' && !!auth?.access;
    } catch {
      return false;
    }
  }

  async getAuthStatus(): Promise<{ authenticated: boolean; details?: string }> {
    try {
      const isValid = await this.validateConfig({});
      return {
        authenticated: isValid,
        details: isValid ? 'OAuth token valid' : 'No valid OAuth token',
      };
    } catch (error) {
      return {
        authenticated: false,
        details: error instanceof Error ? error.message : 'Unknown auth error',
      };
    }
  }

  private getErrorType(message: string): ProviderError['type'] {
    if (message.includes('unauthorized') || message.includes('auth')) return 'auth';
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) return 'network';
    if (message.includes('parse') || message.includes('invalid') || message.includes('validation')) return 'validation';
    return 'api';
  }
}