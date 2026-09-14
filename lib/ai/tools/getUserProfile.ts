import { z } from 'zod';
import type { ToolDefinition } from './types';

/**
 * Tool: Get the current user's fitness profile.
 * Returns physical stats, goals, experience level, equipment access, and injury info.
 */
export const getUserProfileTool: ToolDefinition = {
  name: 'getUserProfile',
  description:
    'Get the current user profile including fitness goals, experience level, equipment access, and physical stats. Always call this before recommending exercises or creating workout plans.',
  parameters: z.object({}),
  async execute(_params, context) {
    const { getUserProfile } = await import('@/lib/db/repositories/userRepository');
    const profile = await getUserProfile(context.userId);
    if (!profile) return { error: 'Profile not found' };
    return profile;
  },
};
