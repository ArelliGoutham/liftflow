import { z } from 'zod';
import type { ToolDefinition } from './types';
import { createWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

export const createWorkoutDayTool: ToolDefinition = {
  name: 'createWorkoutDay',
  description: 'Create a new workout day in a plan for a specific date. Use after createPlan to add days. Date format: YYYY-MM-DD.',
  parameters: z.object({
    planId: z.string().describe('The plan ID from createPlan or getUserPlans'),
    title: z.string().min(1).describe('Day title (e.g., "Upper Body A", "Leg Day", "Rest")'),
    date: z.string().describe('Date in YYYY-MM-DD format (e.g., "2026-09-15")'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    const planId = params.planId || params.plan_id;
    const date = params.date;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { error: 'Invalid date format, use YYYY-MM-DD (e.g., 2026-09-15)' };
    }

    const day = await createWorkoutDay({
      planId: planId as any,
      userId: context.userId as any,
      date,
      title: params.title,
    });

    return {
      success: true,
      workoutDayId: day._id?.toString(),
      date,
      title: day.title,
      message: `Created workout day "${params.title}" on ${date}`,
    };
  },
};
