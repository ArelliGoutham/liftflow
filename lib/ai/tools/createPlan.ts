import { z } from 'zod';
import type { ToolDefinition } from './types';
import { createPlan } from '@/lib/db/repositories/planRepository';

/**
 * Tool: Create a new workout plan.
 */
export const createPlanTool: ToolDefinition = {
  name: 'createPlan',
  description: 'Create a new workout plan for the current user. Returns the new plan ID. Use this when a user wants to start a new training program.',
  parameters: z.object({
    name: z.string().min(1).max(100).describe('Plan name (e.g., "4-Week Upper/Lower Split")'),
    goal: z.string().optional().describe('Training goal (e.g., "hypertrophy", "strength", "endurance")'),
    startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    endDate: z.string().optional().describe('End date in YYYY-MM-DD format (leave empty for open-ended)'),
  }),
  async execute(params, context) {
    const plan = await createPlan({
      userId: context.userId as any,
      name: params.name,
      goal: params.goal,
      isActive: true,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    return {
      success: true,
      planId: plan._id?.toString(),
      name: plan.name,
      message: `Created plan "${params.name}"`,
    };
  },
};
