import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getWorkoutDayWithExerciseNames, updateWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

/**
 * Tool: Remove an exercise from a workout day.
 */
export const removeExerciseTool: ToolDefinition = {
  name: 'removeExerciseFromDay',
  description: 'Remove an exercise from a workout day by exercise ID. Use getWorkoutDays to find the exercise IDs in the day.',
  parameters: z.object({
    workoutDayId: z.string().describe('The workout day ID'),
    exerciseId: z.string().describe('The exercise ID to remove'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    const workoutDayId = params.workoutDayId || params.dayId;
    const exerciseId = params.exerciseId || params.exercise_id;

    const day: any = await getWorkoutDayWithExerciseNames(workoutDayId, context.userId);
    if (!day) {
      return { error: 'Workout day not found' };
    }

    const originalCount = day.exercises?.length || 0;
    const remaining = (day.exercises || [])
      .filter((ex: any) => ex.exerciseId !== exerciseId)
      .map((ex: any, i: number) => ({
        exerciseId: ex.exerciseId,
        order: i,
        trackingMode: ex.trackingMode || 'reps',
        targetSets: ex.targetSets,
        targetRepetitions: ex.targetRepetitions,
        targetDurationValue: ex.targetDurationValue,
        durationUnit: ex.durationUnit,
        restSeconds: ex.restSeconds,
      }));

    if (remaining.length === originalCount) {
      return { error: 'Exercise not found in this workout day' };
    }

    await updateWorkoutDay(workoutDayId, context.userId, { exercises: remaining });

    return { success: true, message: `Removed exercise from ${day.title}`, remainingCount: remaining.length };
  },
};
