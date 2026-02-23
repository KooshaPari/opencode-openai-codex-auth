import { Provider, ProviderRequest, ProviderResult, ProviderError } from '../core/provider.js';
import { logError } from '../logger.js';
import { spawn } from 'node:child_process';

/**
 * Augment CLI provider implementation
 */
export class AugmentProvider implements Provider {
  readonly id = 'augment';
  readonly name = 'Augment CLI';

  async execute(request: ProviderRequest): Promise<ProviderResult> {
    try {
      const { prompt, model, options } = this.parseRequest(request);
      
      // Build augment command
      const args = ['ask', prompt];
      
      if (model) {
        args.push('--model', model);
      }
      
      // Add reasoning options if specified
      if (options?.reasoningEffort) {
        args.push('--reasoning-effort', options.reasoningEffort);
      }
      
      if (options?.reasoningSummary) {
        args.push('--reasoning-summary', options.reasoningSummary);
      }

      // Execute augment CLI
      const result = await this.executeAugment(args);
      
      return {
        content: result.stdout,
        metadata: {
          provider: 'augment',
          model: model || 'default',
          command: `augment ${args.join(' ')}`,
          exitCode: result.exitCode,
        },
      };

    } catch (error) {
      logError('Augment provider error:', error);
      
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
      // Check if augment CLI is available
      const result = await this.executeAugment(['--version']);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  async getAuthStatus(): Promise<{ authenticated: boolean; details?: string }> {
    try {
      const isValid = await this.validateConfig({});
      return {
        authenticated: isValid,
        details: isValid ? 'Augment CLI available' : 'Augment CLI not found',
      };
    } catch (error) {
      return {
        authenticated: false,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private parseRequest(request: ProviderRequest) {
    const body = request.body;
    
    // Extract prompt from messages
    let prompt = '';
    if (body.messages && Array.isArray(body.messages)) {
      const lastMessage = body.messages[body.messages.length - 1];
      if (lastMessage?.content) {
        if (typeof lastMessage.content === 'string') {
          prompt = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
          prompt = lastMessage.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('\n');
        }
      }
    }

    // Extract model
    const model = body.model;

    // Extract options from reasoning config
    const options = {
      reasoningEffort: body.reasoning?.effort,
      reasoningSummary: body.reasoning?.summary,
    };

    return { prompt, model, options };
  }

  private async executeAugment(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const process = spawn('augment', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
        });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private getErrorType(message: string): ProviderError['type'] {
    if (message.includes('command not found') || message.includes('enoent')) return 'process';
    if (message.includes('permission') || message.includes('eacces')) return 'process';
    if (message.includes('timeout') || message.includes('etimedout')) return 'network';
    if (message.includes('invalid') || message.includes('usage')) return 'validation';
    return 'api';
  }
}