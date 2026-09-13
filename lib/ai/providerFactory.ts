import type { AIProvider } from './types';
import { GeminiProvider } from './geminiProvider';

/**
 * Configuration for creating an AI provider instance.
 */
export interface AIConfig {
  /** Provider type identifier */
  provider: 'gemini' | 'openai';
  /** API key for the selected provider */
  apiKey: string;
  /** Optional model name override */
  model?: string;
}

/**
 * Creates an AI provider instance based on configuration.
 * Acts as the factory so route handlers never hardcode a provider class.
 * @param config - Provider type, API key, and optional model name
 * @returns AIProvider instance implementing the strategy interface
 */
export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case 'gemini':
      return new GeminiProvider(config.apiKey, config.model);
    // case 'openai': return new OpenAIProvider(config.apiKey, config.model);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
