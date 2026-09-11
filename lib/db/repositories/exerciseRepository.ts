import connectToDatabase from '@/lib/db/connection';
import Exercise from '@/lib/db/models/Exercise';
import type { IExercise } from '@/types';

export async function getAllExercises(filter?: { category?: string; sharedOnly?: boolean }): Promise<IExercise[]> {
  await connectToDatabase();

  const query: any = {};
  if (filter?.category) {
    query.category = filter.category;
  }
  if (filter?.sharedOnly) {
    query.isShared = true;
  }

  return Exercise.find(query).sort({ name: 1 }).lean() as unknown as Promise<IExercise[]>;
}

export async function getExerciseById(id: string): Promise<IExercise | null> {
  await connectToDatabase();
  return Exercise.findById(id).lean() as unknown as Promise<IExercise | null>;
}

export async function createExercise(data: Partial<IExercise>): Promise<IExercise> {
  await connectToDatabase();
  const exercise = new Exercise(data);
  await exercise.save();
  return exercise.toObject() as IExercise;
}

export async function updateExercise(id: string, data: Partial<IExercise>): Promise<IExercise | null> {
  await connectToDatabase();
  return Exercise.findByIdAndUpdate(id, data, { new: true }).lean() as unknown as Promise<IExercise | null>;
}

export async function deleteExercise(id: string): Promise<IExercise | null> {
  await connectToDatabase();
  return Exercise.findByIdAndDelete(id).lean() as unknown as Promise<IExercise | null>;
}

export async function seedDefaultExercises(exercises: Omit<IExercise, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
  await connectToDatabase();

  for (const exercise of exercises) {
    const exists = await Exercise.findOne({ name: exercise.name });
    if (!exists) {
      await Exercise.create(exercise);
    }
  }
}
