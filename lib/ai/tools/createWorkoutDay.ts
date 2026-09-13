import { z } from 'zod';
import type { ToolDefinition } from './types';
import { createWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

/**
 * Tool: Create a workout day in a plan.
 */
export const createWorkoutDayTool: ToolDefinition = {
  name: 'createWorkoutDay',
  description: 'Create a new workout day in a plan. Use after createPlan to add days. Day of week: 1=Monday, 2=Tuesday, ..., 7=Sunday.',
  parameters: z.object({
    planId: z.string().describe('The plan ID from createPlan or getUserPlans'),
    title: z.string().min(1).describe('Day title (e.g., "Upper Body A", "Leg Day", "Rest")'),
    dayOfWeek: z.number().min(1).max(7).describe('Day of week: 1=Monday through 7=Sunday'),
    weekNumber: z.number().min(1).default(1).describe('Week number (default 1)'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    const planId = params.planId || params.plan_id;
    const dayOfWeek = params.dayOfWeek || params.day_of_week;
    const weekNumber = params.weekNumber || params.week_number || 1;

    const day = await createWorkoutDay({
      planId: planId as any,
      userId: context.userId as any,
      title: params.title,
      dayOfWeek,
      weekNumber,
    });

    return {
      success: true,
      workoutDayId: day._id?.toString(),
      title: day.title,
      message: `Created workout day "${params.title}"`,
    };
  },
};
