import type { Auth, Provider, Model } from "@opencode-ai/sdk";

/**
 * Plugin configuration from ~/.opencode/openai-codex-auth-config.json
 */
export interface PluginConfig {
	/**
	 * Enable CODEX_MODE (Codex-OpenCode bridge prompt instead of tool remap)
	 * @default true
	 */
	codexMode?: boolean;
	
	/**
	 * Provider configuration and fallback strategy
	 */
	providers?: ProviderConfig;
}

/**
 * Provider configuration for multi-provider setup
 */
export interface ProviderConfig {
	/**
	 * Default provider to use when no specific provider is requested
	 * @default 'codex'
	 */
	default?: 'codex' | 'augment' | 'cursor';
	
	/**
	 * Fallback provider when default provider fails
	 * @default 'augment'
	 */
	fallback?: 'codex' | 'augment' | 'cursor';
	
	/**
	 * Provider-specific configurations
	 */
	codex?: CodexProviderConfig;
	augment?: AugmentProviderConfig;
	cursor?: CursorProviderConfig;
	
	/**
	 * Enable automatic fallback between providers
	 * @default true
	 */
	autoFallback?: boolean;
	
	/**
	 * Provider priority for model-based selection
	 * @default ['codex', 'augment', 'cursor']
	 */
	priority?: Array<'codex' | 'augment' | 'cursor'>;
}

/**
 * Codex provider specific configuration
 */
export interface CodexProviderConfig {
	/**
	 * Override default API base URL
	 */
	baseUrl?: string;
	
	/**
	 * Request timeout in milliseconds
	 * @default 30000
	 */
	timeout?: number;
	
	/**
	 * Enable automatic token refresh
	 * @default true
	 */
	autoRefresh?: boolean;
}

/**
 * Augment CLI provider specific configuration
 */
export interface AugmentProviderConfig {
	/**
	 * Path to augment CLI executable
	 * @default 'augment'
	 */
	executable?: string;
	
	/**
	 * Additional CLI arguments
	 */
	args?: string[];
	
	/**
	 * Working directory for CLI execution
	 * @default process.cwd()
	 */
	cwd?: string;
	
	/**
	 * Environment variables for CLI execution
	 */
	env?: Record<string, string>;
}

/**
 * Cursor CLI provider specific configuration
 */
export interface CursorProviderConfig {
	/**
	 * Path to cursor CLI executable
	 * @default 'cursor'
	 */
	executable?: string;
	
	/**
	 * Additional CLI arguments
	 */
	args?: string[];
	
	/**
	 * Working directory for CLI execution
	 * @default process.cwd()
	 */
	cwd?: string;
	
	/**
	 * Environment variables for CLI execution
	 */
	env?: Record<string, string>;
	
	/**
	 * Enable streaming response parsing
	 * @default true
	 */
	streaming?: boolean;
}

/**
 * User configuration structure from opencode.json
 */
export interface UserConfig {
	global: ConfigOptions;
	models: {
		[modelName: string]: {
			options?: ConfigOptions;
		};
	};
}

/**
 * Configuration options for reasoning and text settings
 */
export interface ConfigOptions {
	reasoningEffort?: "minimal" | "low" | "medium" | "high";
	reasoningSummary?: "auto" | "concise" | "detailed";
	textVerbosity?: "low" | "medium" | "high";
	include?: string[];
}

/**
 * Reasoning configuration for requests
 */
export interface ReasoningConfig {
	effort: "minimal" | "low" | "medium" | "high";
	summary: "auto" | "concise" | "detailed";
}

/**
 * OAuth server information
 */
export interface OAuthServerInfo {
	port: number;
	close: () => void;
	waitForCode: (state: string) => Promise<{ code: string } | null>;
}

/**
 * PKCE challenge and verifier
 */
export interface PKCEPair {
	challenge: string;
	verifier: string;
}

/**
 * Authorization flow result
 */
export interface AuthorizationFlow {
	pkce: PKCEPair;
	state: string;
	url: string;
}

/**
 * Token exchange success result
 */
export interface TokenSuccess {
	type: "success";
	access: string;
	refresh: string;
	expires: number;
}

/**
 * Token exchange failure result
 */
export interface TokenFailure {
	type: "failed";
}

/**
 * Token exchange result
 */
export type TokenResult = TokenSuccess | TokenFailure;

/**
 * Parsed authorization input
 */
export interface ParsedAuthInput {
	code?: string;
	state?: string;
}

/**
 * JWT payload with ChatGPT account info
 */
export interface JWTPayload {
	"https://api.openai.com/auth"?: {
		chatgpt_account_id?: string;
	};
	[key: string]: unknown;
}

/**
 * Message input item
 */
export interface InputItem {
	id?: string;
	type: string;
	role: string;
	content?: unknown;
	[key: string]: unknown;
}

/**
 * Request body structure
 */
export interface RequestBody {
	model: string;
	store?: boolean;
	stream?: boolean;
	instructions?: string;
	input?: InputItem[];
	tools?: unknown;
	reasoning?: Partial<ReasoningConfig>;
	text?: {
		verbosity?: "low" | "medium" | "high";
	};
	include?: string[];
	max_output_tokens?: number;
	max_completion_tokens?: number;
	[key: string]: unknown;
}

/**
 * SSE event data structure
 */
export interface SSEEventData {
	type: string;
	response?: unknown;
	[key: string]: unknown;
}

/**
 * Shared metadata structure for ETag-based caches
 */
export interface ETagCacheMetadata {
	etag?: string | null;
	lastChecked?: number;
	[key: string]: unknown;
}

/**
 * Cache metadata for Codex instructions
 */
export interface CodexInstructionsMetadata extends ETagCacheMetadata {
	tag?: string;
	url?: string;
}

/**
 * GitHub release data
 */
export interface GitHubRelease {
	tag_name: string;
	[key: string]: unknown;
}

// Re-export SDK types for convenience
export type { Auth, Provider, Model };
