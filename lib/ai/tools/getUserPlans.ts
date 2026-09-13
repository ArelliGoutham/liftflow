import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getUserPlans } from '@/lib/db/repositories/planRepository';

/**
 * Tool: Get the user's workout plans.
 */
export const getUserPlansTool: ToolDefinition = {
  name: 'getUserPlans',
  description: 'Get all workout plans for the current user. Returns plan names, IDs, goals, and whether each plan is active.',
  parameters: z.object({}),
  async execute(_params, context) {
    const plans = await getUserPlans(context.userId);
    return plans.map((p: any) => ({
      id: p._id?.toString(),
      name: p.name,
      goal: p.goal,
      isActive: p.isActive,
      startDate: p.startDate,
      endDate: p.endDate,
    }));
  },
};
