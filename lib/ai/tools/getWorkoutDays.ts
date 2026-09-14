import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getPlanWorkoutDays } from '@/lib/db/repositories/workoutDayRepository';

export const getWorkoutDaysTool: ToolDefinition = {
  name: 'getWorkoutDays',
  description: 'Get all workout days in a specific plan. Returns day titles, dates, and exercises. Use getUserPlans first to find the plan ID.',
  parameters: z.object({
    planId: z.string().describe('The plan ID from getUserPlans'),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(params: any, context) {
    const planId = params.planId || params.plan_id;
    const days = await getPlanWorkoutDays(planId);
    return days.map((d: any) => ({
      id: d._id?.toString(),
      title: d.title,
      date: d.date,
      exerciseCount: d.exercises?.length || 0,
      exercises: (d.exercises || []).map((ex: any) => ({
        exerciseId: ex.exerciseId,
        trackingMode: ex.trackingMode || 'reps',
        targetSets: ex.targetSets,
        targetRepetitions: ex.targetRepetitions,
        targetDurationValue: ex.targetDurationValue,
        durationUnit: ex.durationUnit,
      })),
    }));
  },
};
