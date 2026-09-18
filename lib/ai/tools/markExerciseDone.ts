import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getWorkoutDayWithExerciseNames, updateWorkoutDay, getPlanWorkoutDays } from '@/lib/db/repositories/workoutDayRepository';
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
    workoutDayId: z.string().optional().describe('The workout day ID (optional — auto-detected from your active plan if not provided)'),
    exerciseId: z.string().describe('The exercise ID that was completed'),
    planId: z.string().optional().describe('The plan ID (optional, auto-detected)'),
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
    const exerciseId = params.exerciseId || params.exercise_id;
    let workoutDayId = params.workoutDayId || params.dayId;

    // Check for an active quick session today first — quick workouts don't need a workout day
    const { getRecentSessions } = await import('@/lib/db/repositories/sessionRepository');
    const recentSessions = await getRecentSessions(context.userId, 10);
    const today = new Date().toISOString().split('T')[0];

    const activeQuickSession: any = recentSessions.find(
      (s: any) => {
        const startedAt = s.startedAt instanceof Date ? s.startedAt.toISOString() : (typeof s.startedAt === 'string' ? s.startedAt : '');
        return s.type === 'quick' && !s.completedAt && startedAt.startsWith(today);
      }
    );

    // If a quick session is active, we can log the exercise directly without a workout day
    if (activeQuickSession && !workoutDayId) {
      const trackingMode = params.trackingMode || 'reps';
      const log = await createLog({
        userId: context.userId as any,
        sessionId: activeQuickSession._id?.toString() as any,
        exerciseId,
        completed: true,
        trackingMode,
        sets: params.sets,
        weight: params.weight,
        repetitions: trackingMode === 'reps' ? params.reps : undefined,
        durationValue: trackingMode === 'duration' ? params.durationValue : undefined,
        durationUnit: trackingMode === 'duration' ? (params.durationUnit || 'seconds') : undefined,
        notes: params.notes || '',
        loggedAt: new Date(),
      });

      return {
        success: true,
        message: `Marked exercise as completed in quick workout`,
        sessionId: activeQuickSession._id?.toString(),
        logId: log._id?.toString(),
        trackingMode,
        sets: params.sets,
        reps: trackingMode === 'reps' ? params.reps : undefined,
        weight: params.weight,
      };
    }

    // If no workoutDayId, auto-detect from user's active plan
    if (!workoutDayId) {
      const { getUserPlans } = await import('@/lib/db/repositories/planRepository');
      const plans = await getUserPlans(context.userId);
      const activePlan = plans.find((p: any) => p.isActive) || plans[0];
      if (!activePlan) {
        return { error: 'No workout plan found. Create a plan first.' };
      }

      const days = await getPlanWorkoutDays(activePlan._id.toString());
      if (days.length === 0) {
        return { error: 'No workout days found in your plan' };
      }

      // Find the day that contains this exercise
      const dayWithExercise = days.find((d: any) =>
        (d.exercises || []).some((ex: any) => ex.exerciseId === exerciseId)
      );

      if (dayWithExercise) {
        workoutDayId = dayWithExercise._id.toString();
      } else {
        // Find today's day by date
        const todayDateStr = new Date().toISOString().split('T')[0];
        const todayDay = days.find((d: any) => d.date === todayDateStr) || days[0];
        if (!todayDay) {
          return { error: 'No workout days found in your plan' };
        }
        workoutDayId = todayDay._id.toString();
      }
    }

    // Get the workout day to find the plan and exercise details
    const day: any = await getWorkoutDayWithExerciseNames(workoutDayId, context.userId);
    if (!day) {
      return { error: 'Workout day not found' };
    }

    // Find the exercise in the day to get its tracking mode
    const exerciseConfig = (day.exercises || []).find((e: any) => e.exerciseId === exerciseId);
    const trackingMode = params.trackingMode || exerciseConfig?.trackingMode || 'reps';

    // Check if there's an uncompleted session today for this day
    let session: any = recentSessions.find(
      (s: any) => {
        const startedAt = s.startedAt instanceof Date ? s.startedAt.toISOString() : (typeof s.startedAt === 'string' ? s.startedAt : '');
        const workoutDayIdMatch = s.workoutDayId?.toString() === workoutDayId;
        const isToday = startedAt.startsWith(today);
        return workoutDayIdMatch && !s.completedAt && isToday;
      }
    );

    // Create a session if none exists today
    if (!session) {
      // Get planId from the workout day
      const dayForPlan: any = await getWorkoutDayWithExerciseNames(workoutDayId, context.userId);
      const planId = dayForPlan?.planId?.toString() || params.planId;

      session = await createSession({
        userId: context.userId as any,
        planId: planId as any,
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
    workoutDayId: z.string().optional().describe('The workout day ID (optional — auto-detected from active session if not provided)'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    let workoutDayId = params.workoutDayId || params.dayId;

    // If no workoutDayId, find today's active session
    const { getRecentSessions } = await import('@/lib/db/repositories/sessionRepository');
    const recentSessions = await getRecentSessions(context.userId, 10);
    const today = new Date().toISOString().split('T')[0];

    let session: any = recentSessions.find(
      (s: any) => {
        const startedAt = s.startedAt instanceof Date ? s.startedAt.toISOString() : (typeof s.startedAt === 'string' ? s.startedAt : '');
        return !s.completedAt && startedAt.startsWith(today);
      }
    );

    if (!session) {
      // No active session — try to find from workout days
      if (!workoutDayId) {
        const { getUserPlans } = await import('@/lib/db/repositories/planRepository');
        const plans = await getUserPlans(context.userId);
        const activePlan = plans.find((p: any) => p.isActive) || plans[0];
        if (!activePlan) {
          return { error: 'No active workout session or plan found' };
        }
        const days = await getPlanWorkoutDays(activePlan._id.toString());
        const todayDateStr = new Date().toISOString().split('T')[0];
        const todayDay = days.find((d: any) => d.date === todayDateStr) || days[0];
        if (!todayDay) {
          return { error: 'No workout days found' };
        }
        workoutDayId = todayDay._id.toString();
      }

      // Create a session if none exists
      session = await createSession({
        userId: context.userId as any,
        workoutDayId: workoutDayId as any,
        startedAt: new Date(),
      });
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
