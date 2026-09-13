import { z } from 'zod';
import type { ToolDefinition } from './types';
import { getExternalExercises } from '@/lib/exercises/externalExercises';
import { getAllExercises } from '@/lib/db/repositories/exerciseRepository';

/**
 * Tool: Search exercises by name, muscle, equipment, or category.
 */
export const searchExercisesTool: ToolDefinition = {
  name: 'searchExercises',
  description: 'Search the exercise library by name, muscle group, equipment, or category. Returns matching exercises with their IDs, names, and categories. Use this when a user asks about exercises for a specific muscle or with specific equipment.',
  parameters: z.object({
    query: z.string().optional().describe('Search term to match exercise names (case-insensitive)'),
    muscle: z.string().optional().describe('Filter by primary muscle group (e.g., "hamstrings", "chest", "quadriceps")'),
    equipment: z.string().optional().describe('Filter by equipment (e.g., "barbell", "dumbbell", "body only")'),
    category: z.string().optional().describe('Filter by category (e.g., "upper-body", "lower-body", "core", "cardio")'),
  }),
  async execute(params) {
    let exercises = await getExternalExercises();

    if (params.query) {
      const q = params.query.toLowerCase();
      exercises = exercises.filter((e: any) => e.name?.toLowerCase().includes(q));
    }
    if (params.muscle) {
      const m = params.muscle.toLowerCase();
      exercises = exercises.filter((e: any) =>
        e.primaryMuscles?.some((mu: string) => mu.toLowerCase().includes(m)) ||
        e.secondaryMuscles?.some((mu: string) => mu.toLowerCase().includes(m))
      );
    }
    if (params.equipment) {
      const eq = params.equipment.toLowerCase();
      exercises = exercises.filter((e: any) => e.equipment?.toLowerCase().includes(eq));
    }
    if (params.category) {
      exercises = exercises.filter((e: any) => e.category === params.category);
    }

    return exercises.slice(0, 20).map((e: any) => ({
      id: e._id || e.id,
      name: e.name,
      category: e.category,
      equipment: e.equipment,
      primaryMuscles: e.primaryMuscles,
      level: e.level,
    }));
  },
};
