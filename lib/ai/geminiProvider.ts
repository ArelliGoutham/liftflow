import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import type { AIProvider, AIStreamResult } from './types';

/**
 * Gemini-based implementation of the AIProvider strategy.
 * Wraps the @ai-sdk/google SDK behind the app-specific AIProvider interface.
 */
export class GeminiProvider implements AIProvider {
  /**
   * Creates a GeminiProvider instance.
   * @param apiKey - Google Gemini API key
   * @param model - Gemini model identifier (default: gemini-3.1-flash-lite)
   */
  constructor(
    private apiKey: string,
    private model: string = 'gemini-3.1-flash-lite'
  ) {}

  /**
   * Streams a chat response from the Gemini model.
   * @param systemPrompt - System instructions for the model
   * @param messages - Conversation messages in model format
   * @param options - Temperature, max output tokens, and onFinish callback
   * @returns Promise resolving to a stream result that can be converted to a UI message stream response
   */
  async streamChat(
    systemPrompt: string,
    messages: any[],
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      maxSteps?: number;
      tools?: Record<string, any>;
      onFinish?: (completion: { text: string }) => void | Promise<void>;
    }
  ): Promise<AIStreamResult> {
    const google = createGoogleGenerativeAI({ apiKey: this.apiKey });

    // Check if messages are UIMessage format (have 'parts') or ModelMessage format (have 'content')
    const isUIMessage = messages.length > 0 && messages[0]?.parts !== undefined;
    const modelMessages = isUIMessage
      ? await convertToModelMessages(messages)
      : messages;

    const result = streamText({
      model: google(this.model),
      system: systemPrompt,
      messages: modelMessages,
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 500,
      stopWhen: stepCountIs(options?.maxSteps ?? 5),
      tools: options?.tools,
      onFinish: options?.onFinish,
    });
    return result as unknown as AIStreamResult;
  }
}
