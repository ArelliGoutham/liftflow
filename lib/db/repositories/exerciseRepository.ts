import connectToDatabase from '@/lib/db/connection';
import Exercise from '@/lib/db/models/Exercise';
import type { IExercise, IExternalExercise, ICreateExerciseDTO } from '@/types';

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

export async function getExerciseById(id: string): Promise<IExternalExercise | null> {
  await connectToDatabase();
  return Exercise.findById(id).lean() as unknown as Promise<IExternalExercise | null>;
}

export async function createExercise(data: ICreateExerciseDTO): Promise<IExercise> {
  await connectToDatabase();
  const exercise = new Exercise(data);
  await exercise.save();
  return exercise.toObject();
}

export async function updateExercise(id: string, ownerUserId: string, data: Partial<ICreateExerciseDTO>): Promise<IExercise | null> {
  await connectToDatabase();
  return Exercise.findOneAndUpdate({ _id: id, ownerUserId, isShared: false }, data, { new: true }).lean() as unknown as Promise<IExercise | null>;
}

export async function deleteExercise(id: string, ownerUserId: string): Promise<IExercise | null> {
  await connectToDatabase();
  return Exercise.findOneAndDelete({ _id: id, ownerUserId, isShared: false }).lean() as unknown as Promise<IExercise | null>;
}
