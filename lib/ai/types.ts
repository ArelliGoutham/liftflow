/**
 * Result of an AI streaming chat call.
 * Wraps the provider SDK's stream result so route handlers
 * never depend on a specific AI SDK type.
 */
export interface AIStreamResult {
  /**
   * Converts the stream result to a UI message stream HTTP response.
   * @returns Response with a streaming body consumable by useChat
   */
  toUIMessageStreamResponse(): Response;
}

/**
 * Strategy interface for AI chat providers.
 * All providers (Gemini, OpenAI, etc.) implement this interface
 * so route handlers depend on the abstraction, not a concrete SDK.
 */
export interface AIProvider {
  /**
   * Streams a chat response from the AI model.
   * @param systemPrompt - System instructions for the model
   * @param messages - Conversation messages in model format
   * @param options - Temperature, max tokens, and onFinish callback
   * @returns Promise resolving to a stream result that can be converted to a UI message stream response
   */
  streamChat(
    systemPrompt: string,
    messages: any[],
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      onFinish?: (completion: { text: string }) => void | Promise<void>;
    }
  ): Promise<AIStreamResult>;
}
