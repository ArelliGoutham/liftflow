import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getWorkoutDayWithExerciseNames, updateWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

/**
 * Tool: Add an exercise to a workout day.
 */
export const addExerciseToDayTool: ToolDefinition = {
  name: 'addExerciseToDay',
  description: 'Add an exercise to a specific workout day. Use searchExercises to find the exercise ID and getWorkoutDays to find the day ID first. Specify either reps or duration based on the exercise type.',
  parameters: z.object({
    workoutDayId: z.string().describe('The workout day ID from getWorkoutDays or createWorkoutDay result'),
    exerciseId: z.string().describe('The exercise ID from searchExercises result'),
    targetSets: z.number().min(1).max(10).default(3).describe('Number of sets (default 3)'),
    trackingMode: z.enum(['reps', 'duration']).default('reps').describe('Track by reps or duration'),
    targetRepetitions: z.number().optional().describe('Target reps per set (for reps mode). Can also use "reps"'),
    targetDurationValue: z.number().optional().describe('Duration value (for duration mode). Can also use "duration"'),
    durationUnit: z.enum(['seconds', 'minutes']).optional().describe('Duration unit (for duration mode)'),
    restSeconds: z.number().min(0).max(600).default(90).describe('Rest between sets in seconds (default 90)'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    // Accept aliases the AI model might use (day_id, exercise_id, reps, duration)
    const workoutDayId = params.workoutDayId || params.dayId;
    const exerciseId = params.exerciseId || params.exercise_id;
    const targetReps = params.targetRepetitions ?? params.reps;
    const targetDuration = params.targetDurationValue ?? params.duration;
    const trackingMode = params.trackingMode || 'reps';

    if (!workoutDayId || !exerciseId) {
      return { error: 'Missing workoutDayId or exerciseId', received: { workoutDayId, exerciseId } };
    }

    const day: any = await getWorkoutDayWithExerciseNames(workoutDayId, context.userId);
    if (!day) {
      return { error: 'Workout day not found', workoutDayId };
    }

    const exercises = day.exercises || [];
    const nextOrder = exercises.length > 0 ? Math.max(...exercises.map((e: any) => e.order ?? 0)) + 1 : 0;

    const newExercise = {
      exerciseId,
      order: nextOrder,
      trackingMode,
      targetSets: params.targetSets || 3,
      targetRepetitions: trackingMode === 'reps' ? targetReps : undefined,
      targetDurationValue: trackingMode === 'duration' ? targetDuration : undefined,
      durationUnit: trackingMode === 'duration' ? (params.durationUnit || 'seconds') : undefined,
      restSeconds: params.restSeconds || 90,
    };

    const updated = await updateWorkoutDay(workoutDayId, context.userId, {
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

    return { success: true, message: `Exercise added to ${day.title}`, exerciseId, sets: params.targetSets || 3 };
  },
};
