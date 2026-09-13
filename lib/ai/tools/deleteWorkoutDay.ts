import { z } from 'zod';
import type { ToolDefinition } from './types';
import { deleteWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

/**
 * Tool: Delete a workout day from a plan.
 */
export const deleteWorkoutDayTool: ToolDefinition = {
  name: 'deleteWorkoutDay',
  description: 'Delete a workout day from a plan. Use getWorkoutDays to find the day ID first. This cannot be undone.',
  parameters: z.object({
    workoutDayId: z.string().describe('The workout day ID to delete'),
  }),
  async execute(params, context) {
    const result = await deleteWorkoutDay(params.workoutDayId, context.userId);
    if (!result) {
      return { error: 'Workout day not found or does not belong to you' };
    }
    return { success: true, message: 'Workout day deleted' };
  },
};
