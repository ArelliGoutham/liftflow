import connectToDatabase from '@/lib/db/connection';
import Exercise from '@/lib/db/models/Exercise';
import type { IExercise, IExternalExercise, ICreateExerciseDTO } from '@/types';

/**
 * Retrieves all exercises with optional filtering by category, muscle, equipment, level, or search term.
 * @param filter - Optional criteria to narrow results (category, sharedOnly, muscle, equipment, level, search)
 * @returns Array of exercise documents matching the filter, sorted by name
 */
export async function getAllExercises(filter?: {
  category?: string;
  sharedOnly?: boolean;
  muscle?: string;
  equipment?: string;
  level?: string;
  search?: string;
}): Promise<IExercise[]> {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (filter?.category) query.category = filter.category;
  if (filter?.sharedOnly) query.isShared = true;
  if (filter?.muscle) query.primaryMuscles = filter.muscle;
  if (filter?.equipment) query.equipment = filter.equipment;
  if (filter?.level) query.level = filter.level;
  if (filter?.search) {
    query.name = { $regex: filter.search, $options: 'i' };
  }

  return Exercise.find(query).sort({ name: 1 }).lean() as unknown as Promise<IExercise[]>;
}

/**
 * Retrieves a single exercise by its MongoDB ObjectId.
 * @param id - The exercise's MongoDB ObjectId as a string
 * @returns The matching exercise document, or null if not found
 */
export async function getExerciseById(id: string): Promise<IExternalExercise | null> {
  await connectToDatabase();
  return Exercise.findById(id).lean() as unknown as Promise<IExternalExercise | null>;
}

/**
 * Creates a new exercise document in the database.
 * @param data - The exercise data transfer object with all required fields
 * @returns The newly created exercise document
 */
export async function createExercise(data: ICreateExerciseDTO): Promise<IExercise> {
  await connectToDatabase();
  const exercise = new Exercise(data);
  await exercise.save();
  return exercise.toObject();
}

/**
 * Updates an exercise owned by the specified user (only non-shared exercises can be updated).
 * @param id - The exercise's MongoDB ObjectId as a string
 * @param ownerUserId - The owner's MongoDB ObjectId as a string
 * @param data - Partial exercise fields to update
 * @returns The updated exercise document, or null if not found or not owned by the user
 */
export async function updateExercise(id: string, ownerUserId: string, data: Partial<ICreateExerciseDTO>): Promise<IExercise | null> {
  await connectToDatabase();
  return Exercise.findOneAndUpdate({ _id: id, ownerUserId, isShared: false }, data, { new: true }).lean() as unknown as Promise<IExercise | null>;
}

/**
 * Deletes an exercise owned by the specified user (only non-shared exercises can be deleted).
 * @param id - The exercise's MongoDB ObjectId as a string
 * @param ownerUserId - The owner's MongoDB ObjectId as a string
 * @returns The deleted exercise document, or null if not found or not owned by the user
 */
export async function deleteExercise(id: string, ownerUserId: string): Promise<IExercise | null> {
  await connectToDatabase();
  return Exercise.findOneAndDelete({ _id: id, ownerUserId, isShared: false }).lean() as unknown as Promise<IExercise | null>;
}
