import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getLogsByExercise } from '@/lib/db/repositories/logRepository';

/**
 * Tool: Get progress data for a specific exercise.
 */
export const getProgressTool: ToolDefinition = {
  name: 'getProgress',
  description: 'Get the user\'s logged workout progress for a specific exercise. Returns recent log entries with sets, reps, weight, and dates. Use this when a user asks about their progress or wants to see how they\'re improving.',
  parameters: z.object({
    exerciseId: z.string().describe('The exercise ID to check progress for'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    const exerciseId = params.exerciseId || params.exercise_id;

    const logs = await getLogsByExercise(context.userId, exerciseId, 20);
    return logs.map((l: any) => ({
      date: l.loggedAt?.toISOString()?.split('T')[0],
      completed: l.completed,
      sets: l.sets,
      reps: l.repetitions,
      weight: l.weight,
      durationValue: l.durationValue,
      durationUnit: l.durationUnit,
      notes: l.notes,
    }));
  },
};
