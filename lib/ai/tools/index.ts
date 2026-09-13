import type { ToolDefinition, ToolContext } from './types';
import { searchExercisesTool } from './searchExercises';
import { getUserPlansTool } from './getUserPlans';
import { getWorkoutDaysTool } from './getWorkoutDays';
import { addExerciseToDayTool } from './addExerciseToDay';
import { removeExerciseTool } from './removeExercise';
import { createPlanTool } from './createPlan';
import { createWorkoutDayTool } from './createWorkoutDay';
import { getProgressTool } from './getProgress';
import { deleteWorkoutDayTool } from './deleteWorkoutDay';

/**
 * All available AI tools in a registry array.
 * To add a new tool, create a file in this directory and add it here.
 * This registry is shared between the chat API route and (future) MCP server.
 */
export const allTools: ToolDefinition[] = [
  searchExercisesTool,
  getUserPlansTool,
  getWorkoutDaysTool,
  addExerciseToDayTool,
  removeExerciseTool,
  createPlanTool,
  createWorkoutDayTool,
  deleteWorkoutDayTool,
  getProgressTool,
];

/**
 * Converts ToolDefinitions to the format expected by the AI SDK's streamText.
 * Each tool becomes a zod-schema-validated function the model can call.
 * @param context - User session context (userId, email, name)
 * @returns Object mapping tool names to AI SDK tool definitions
 */
export function getAITools(context: ToolContext) {
  const tools: Record<string, any> = {};
  for (const tool of allTools) {
    tools[tool.name] = {
      description: tool.description,
      parameters: tool.parameters,
      execute: async (params: any) => {
        try {
          const result = await tool.execute(params, context);
          return JSON.stringify(result);
        } catch (err) {
          console.error(`[AI tool: ${tool.name}] Error:`, err);
          return JSON.stringify({ error: 'Tool execution failed' });
        }
      },
    };
  }
  return tools;
}

export type { ToolDefinition, ToolContext };
