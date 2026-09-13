import { z } from 'zod';

/**
 * Defines the structure of an AI tool that can be called by the model.
 * Each tool has a name, description, parameter schema, and execute function.
 * @interface ToolDefinition
 */
export interface ToolDefinition {
  /** Unique tool name used by the AI model */
  name: string;
  /** Description that tells the AI when to use this tool */
  description: string;
  /** Zod schema for validating tool parameters */
  parameters: z.ZodSchema;
  /** Executes the tool with validated parameters and returns a result */
  execute: (params: any, context: ToolContext) => Promise<any>;
}

/**
 * Context passed to every tool execution, containing user session info
 * and access to repositories.
 * @interface ToolContext
 */
export interface ToolContext {
  /** Authenticated user's MongoDB ObjectId as string */
  userId: string;
  /** User's email address */
  email?: string;
  /** User's display name */
  name?: string;
}
