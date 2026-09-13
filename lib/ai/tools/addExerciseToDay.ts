import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getWorkoutDayWithExerciseNames } from '@/lib/db/repositories/workoutDayRepository';
import { updateWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

/**
 * Tool: Add an exercise to a workout day.
 */
export const addExerciseToDayTool: ToolDefinition = {
  name: 'addExerciseToDay',
  description: 'Add an exercise to a specific workout day. Use searchExercises to find the exercise ID and getWorkoutDays to find the day ID first. Specify either reps or duration based on the exercise type.',
  parameters: z.object({
    workoutDayId: z.string().describe('The workout day ID from getWorkoutDays'),
    exerciseId: z.string().describe('The exercise ID from searchExercises'),
    targetSets: z.number().min(1).max(10).default(3).describe('Number of sets (default 3)'),
    trackingMode: z.enum(['reps', 'duration']).default('reps').describe('Track by reps or duration'),
    targetRepetitions: z.number().optional().describe('Target reps per set (for reps mode)'),
    targetDurationValue: z.number().optional().describe('Duration value (for duration mode)'),
    durationUnit: z.enum(['seconds', 'minutes']).optional().describe('Duration unit (for duration mode)'),
    restSeconds: z.number().min(0).max(600).default(90).describe('Rest between sets in seconds (default 90)'),
  }),
  async execute(params, context) {
    const day: any = await getWorkoutDayWithExerciseNames(params.workoutDayId, context.userId);
    if (!day) {
      return { error: 'Workout day not found' };
    }

    const exercises = day.exercises || [];
    const nextOrder = exercises.length > 0 ? Math.max(...exercises.map((e: any) => e.order ?? 0)) + 1 : 0;

    const newExercise = {
      exerciseId: params.exerciseId,
      order: nextOrder,
      trackingMode: params.trackingMode,
      targetSets: params.targetSets,
      targetRepetitions: params.trackingMode === 'reps' ? params.targetRepetitions : undefined,
      targetDurationValue: params.trackingMode === 'duration' ? params.targetDurationValue : undefined,
      durationUnit: params.trackingMode === 'duration' ? (params.durationUnit || 'seconds') : undefined,
      restSeconds: params.restSeconds,
    };

    const updated = await updateWorkoutDay(params.workoutDayId, context.userId, {
      exercises: [...exercises.map((e: any) => ({
        exerciseId: e.exerciseId,
        order: e.order,
        trackingMode: e.trackingMode || 'reps',
        targetSets: e.targetSets,
        targetRepetitions: e.targetRepetitions,
        targetDurationValue: e.targetDurationValue,
        durationUnit: e.durationUnit,
        restSeconds: e.restSeconds,
      })), newExercise],
    });

    if (!updated) {
      return { error: 'Failed to add exercise' };
    }

    return { success: true, message: `Exercise added to ${day.title}`, exerciseId: params.exerciseId, sets: params.targetSets };
  },
};
