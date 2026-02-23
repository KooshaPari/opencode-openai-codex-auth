import { RequestProcessor } from '../core/request-processor.js';
import { getProviderByModel } from './provider-registry.js';
import { logError, logDebug } from '../logger.js';
import { isProviderError, isProviderResponse } from '../core/provider.js';
import type { Auth } from '@opencode-ai/sdk';
import type { RequestBody } from '../types.js';

/**
 * Create a provider-aware fetch implementation
 * This replaces the original Codex-specific fetch with a multi-provider system
 */
export function createProviderFetch(
  getAuth: () => Promise<Auth>,
  accountId: string,
  userConfig: any,
  codexMode: boolean
) {
  const requestProcessor = new RequestProcessor();

  return async (input: Request | string | URL, init?: RequestInit): Promise<Response> => {
    try {
      // Extract request body
      let requestBody: RequestBody | undefined;
      if (init?.body) {
        try {
          requestBody = JSON.parse(init.body as string) as RequestBody;
        } catch (error) {
          logError('Failed to parse request body:', error);
          return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      if (!requestBody) {
        return new Response(
          JSON.stringify({ error: 'Missing request body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get current auth
      const auth = await getAuth();
      
      // Determine provider based on model
      const provider = getProviderByModel(requestBody.model || 'default');
      
      logDebug(`Using provider: ${provider.name} for model: ${requestBody.model}`);

      // Prepare provider context
      const providerContext = {
        originalModel: requestBody.model,
        userConfig: userConfig.global || {},
        providerConfig: {
          auth,
          accountId,
          codexMode,
          models: userConfig.models || {},
        },
      };

      // Register provider with processor
      requestProcessor.registerProvider(provider);

      // Execute request through processor
      const result = await requestProcessor.process(requestBody, provider.id);

      // Handle provider result
      if (isProviderError(result)) {
        // This is an error
        return new Response(
          JSON.stringify({ 
            error: result.message,
            provider: provider.id,
            code: result.code,
          }),
          { 
            status: typeof result.code === 'number' ? result.code : 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // This is a successful response
      if (isProviderResponse(result)) {
        return new Response(result.content, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Provider': provider.id,
            'X-Model': requestBody.model || 'default',
            ...(result.metadata && { 'X-Metadata': JSON.stringify(result.metadata) }),
          },
        });
      }

      // Fallback for unexpected result type
      return new Response(
        JSON.stringify({ error: 'Invalid provider result' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      logError('Provider fetch error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          provider: 'unknown',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}