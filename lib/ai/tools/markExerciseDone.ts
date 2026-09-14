import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getWorkoutDayWithExerciseNames, updateWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';
import { createSession, completeSession } from '@/lib/db/repositories/sessionRepository';
import { createLog, updateLog } from '@/lib/db/repositories/logRepository';

/**
 * Tool: Mark an exercise as completed in a workout session.
 * Creates a workout session if one doesn't exist, then logs the exercise as complete.
 */
export const markExerciseDoneTool: ToolDefinition = {
  name: 'markExerciseDone',
  description: 'Mark an exercise as completed during a workout session. Use this when a user says they finished an exercise. Automatically creates a workout session if needed and logs the exercise with the provided stats.',
  parameters: z.object({
    workoutDayId: z.string().describe('The workout day ID the exercise belongs to'),
    exerciseId: z.string().describe('The exercise ID that was completed'),
    planId: z.string().optional().describe('The plan ID (optional, auto-detected from workout day)'),
    sets: z.number().optional().describe('Number of sets completed'),
    reps: z.number().optional().describe('Reps performed per set'),
    weight: z.number().optional().describe('Weight used in kg'),
    durationValue: z.number().optional().describe('Duration completed (for duration-mode exercises)'),
    durationUnit: z.enum(['seconds', 'minutes']).optional().describe('Duration unit'),
    trackingMode: z.enum(['reps', 'duration']).optional().describe('Tracking mode (auto-detected if not provided)'),
    notes: z.string().optional().describe('User notes about the exercise'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    const workoutDayId = params.workoutDayId || params.dayId;
    const exerciseId = params.exerciseId || params.exercise_id;

    // Get the workout day to find the plan and exercise details
    const day: any = await getWorkoutDayWithExerciseNames(workoutDayId, context.userId);
    if (!day) {
      return { error: 'Workout day not found' };
    }

    // Find the exercise in the day to get its tracking mode
    const exerciseConfig = (day.exercises || []).find((e: any) => e.exerciseId === exerciseId);
    const trackingMode = params.trackingMode || exerciseConfig?.trackingMode || 'reps';

    // Check if there's an uncompleted session today for this day
    const { getRecentSessions } = await import('@/lib/db/repositories/sessionRepository');
    const recentSessions = await getRecentSessions(context.userId, 10);
    const today = new Date().toISOString().split('T')[0];

    let session: any = recentSessions.find(
      (s: any) =>
        s.workoutDayId?.toString() === workoutDayId &&
        !s.completedAt &&
        s.startedAt?.startsWith(today)
    );

    // Create a session if none exists today
    if (!session) {
      session = await createSession({
        userId: context.userId as any,
        planId: (day.planId?.toString() || params.planId) as any,
        workoutDayId: workoutDayId as any,
        startedAt: new Date(),
      });
    }

    // Create or update the exercise log
    const log = await createLog({
      userId: context.userId as any,
      sessionId: session._id?.toString() as any,
      exerciseId,
      completed: true,
      trackingMode,
      sets: params.sets || exerciseConfig?.targetSets,
      weight: params.weight,
      repetitions: trackingMode === 'reps' ? (params.reps || exerciseConfig?.targetRepetitions) : undefined,
      durationValue: trackingMode === 'duration' ? params.durationValue : undefined,
      durationUnit: trackingMode === 'duration' ? (params.durationUnit || 'seconds') : undefined,
      notes: params.notes || '',
      loggedAt: new Date(),
    });

    // Return exercise name for confirmation
    const exerciseName = exerciseConfig?.exerciseName || exerciseId;

    return {
      success: true,
      message: `Marked "${exerciseName}" as completed`,
      sessionId: session._id?.toString(),
      logId: log._id?.toString(),
      trackingMode,
      sets: params.sets || exerciseConfig?.targetSets,
      reps: trackingMode === 'reps' ? (params.reps || exerciseConfig?.targetRepetitions) : undefined,
      weight: params.weight,
    };
  },
};

/**
 * Tool: Finish a workout session (mark all done).
 */
export const finishWorkoutTool: ToolDefinition = {
  name: 'finishWorkout',
  description: 'Mark a workout session as complete. Use this when a user says they finished their workout or wants to end the session.',
  parameters: z.object({
    workoutDayId: z.string().describe('The workout day ID for the session being finished'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    const workoutDayId = params.workoutDayId || params.dayId;

    // Find today's uncompleted session for this day
    const { getRecentSessions } = await import('@/lib/db/repositories/sessionRepository');
    const recentSessions = await getRecentSessions(context.userId, 10);
    const today = new Date().toISOString().split('T')[0];

    const session: any = recentSessions.find(
      (s: any) =>
        s.workoutDayId?.toString() === workoutDayId &&
        !s.completedAt &&
        s.startedAt?.startsWith(today)
    );

    if (!session) {
      return { error: 'No active workout session found for today' };
    }

    const completed = await completeSession(session._id?.toString(), context.userId);

    if (!completed) {
      return { error: 'Failed to finish workout' };
    }

    const day: any = await getWorkoutDayWithExerciseNames(workoutDayId, context.userId);
    return {
      success: true,
      message: `Workout "${day?.title || 'session'}" completed! Great job!`,
      sessionId: session._id?.toString(),
      completedAt: new Date().toISOString(),
    };
  },
};
