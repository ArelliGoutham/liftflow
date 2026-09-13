import { getExerciseById } from '@/lib/db/repositories/exerciseRepository';
import { getExternalExerciseById } from '@/lib/exercises/externalExercises';
import { isMongoId } from '@/lib/utils';
import type { IExternalExercise, IExercise } from '@/types';

/**
 * Retrieves a single exercise for display, checking the database first then the external CDN.
 * If the ID is a valid MongoDB ObjectId, the database is queried first. If no database
 * exercise is found (or the ID is not a Mongo ObjectId), the external exercise CDN is queried.
 * @param id - The exercise identifier (Mongo ObjectId or external exercise source ID)
 * @returns Promise resolving to the exercise document, or null if not found in either source
 */
export async function getExerciseForDisplay(id: string): Promise<IExternalExercise | IExercise | null> {
  if (isMongoId(id)) {
    const dbExercise = await getExerciseById(id);
    if (dbExercise) return dbExercise;
  }
  return getExternalExerciseById(id);
}
