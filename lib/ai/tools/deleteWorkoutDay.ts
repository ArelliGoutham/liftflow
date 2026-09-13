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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    const workoutDayId = params.workoutDayId || params.dayId;

    const result = await deleteWorkoutDay(workoutDayId, context.userId);
    if (!result) {
      return { error: 'Workout day not found or does not belong to you' };
    }
    return { success: true, message: 'Workout day deleted' };
  },
};
