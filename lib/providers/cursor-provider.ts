import { Provider, ProviderRequest, ProviderResult, ProviderError } from '../core/provider.js';
import { logError } from '../logger.js';
import { spawn } from 'node:child_process';
import { Transform } from 'node:stream';

/**
 * Cursor CLI provider implementation with streaming JSON parsing
 */
export class CursorProvider implements Provider {
  readonly id = 'cursor';
  readonly name = 'Cursor CLI';

  async execute(request: ProviderRequest): Promise<ProviderResult> {
    try {
      const { prompt, model, options } = this.parseRequest(request);
      
      // Build cursor command
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

      // Execute cursor CLI with streaming
      const result = await this.executeCursorWithStreaming(args);
      
      return {
        content: result.content,
        metadata: {
          provider: 'cursor',
          model: model || 'default',
          command: `cursor ${args.join(' ')}`,
          exitCode: result.exitCode,
          streaming: true,
        },
        isStreaming: true,
      };

    } catch (error) {
      logError('Cursor provider error:', error);
      
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
      // Check if cursor CLI is available
      const result = await this.executeCursor(['--version']);
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
        details: isValid ? 'Cursor CLI available' : 'Cursor CLI not found',
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

  private async executeCursor(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const process = spawn('cursor', args, {
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

  private async executeCursorWithStreaming(args: string[]): Promise<{ content: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const process = spawn('cursor', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let content = '';
      let stderr = '';
      let exitCode = 0;

      // Create a transform stream to parse streaming JSON
      const jsonParser = new Transform({
        transform(chunk: Buffer, encoding, callback) {
          const data = chunk.toString();
          
          // Split by newlines and try to parse each line as JSON
          const lines = data.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              try {
                const json = JSON.parse(line);
                // Extract content from various cursor output formats
                if (json.content) {
                  content += json.content;
                } else if (json.text) {
                  content += json.text;
                } else if (json.choices?.[0]?.delta?.content) {
                  content += json.choices[0].delta.content;
                } else if (typeof json === 'string') {
                  content += json;
                }
              } catch {
                // If not JSON, treat as plain text
                content += line + '\n';
              }
            }
          }
          callback();
        }
      });

      process.stdout?.pipe(jsonParser);

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        exitCode = code || 0;
        resolve({
          content: content.trim(),
          exitCode,
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