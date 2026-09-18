import { z } from 'zod';
import type { ToolDefinition } from './types';
import { createSession } from '@/lib/db/repositories/sessionRepository';

/**
 * Tool: Start a quick ad-hoc workout session without a pre-made plan.
 * Creates a workout session with type 'quick' and no planId/workoutDayId.
 */
export const startQuickWorkoutTool: ToolDefinition = {
  name: 'startQuickWorkout',
  description: 'Start an ad-hoc (quick) workout session without a plan. Use when user says they are at the gym and want to track exercises without a pre-made plan.',
  parameters: z.object({}),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(_params, context) {
    const session = await createSession({
      userId: context.userId as any,
      type: 'quick',
      startedAt: new Date(),
    });
    return {
      success: true,
      sessionId: session._id?.toString(),
      message: 'Quick workout session started. Use markExerciseDone to log exercises.',
    };
  },
};
