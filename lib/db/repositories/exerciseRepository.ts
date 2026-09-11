import connectToDatabase from '@/lib/db/connection';
import Exercise from '@/lib/db/models/Exercise';

export async function getAllExercises(filter?: {
  category?: string;
  sharedOnly?: boolean;
  muscle?: string;
  equipment?: string;
  level?: string;
  search?: string;
}): Promise<any[]> {
  await connectToDatabase();

  const query: any = {};
  if (filter?.category) query.category = filter.category;
  if (filter?.sharedOnly) query.isShared = true;
  if (filter?.muscle) query.primaryMuscles = filter.muscle;
  if (filter?.equipment) query.equipment = filter.equipment;
  if (filter?.level) query.level = filter.level;
  if (filter?.search) {
    query.name = { $regex: filter.search, $options: 'i' };
  }

  return Exercise.find(query).sort({ name: 1 }).lean() as unknown as Promise<any[]>;
}

export async function getExerciseById(id: string): Promise<any | null> {
  await connectToDatabase();
  return Exercise.findById(id).lean() as unknown as Promise<any | null>;
}

export async function createExercise(data: any): Promise<any> {
  await connectToDatabase();
  const exercise = new Exercise(data);
  await exercise.save();
  return exercise.toObject();
}

export async function updateExercise(id: string, data: any): Promise<any | null> {
  await connectToDatabase();
  return Exercise.findByIdAndUpdate(id, data, { new: true }).lean() as unknown as Promise<any | null>;
}

export async function deleteExercise(id: string): Promise<any | null> {
  await connectToDatabase();
  return Exercise.findByIdAndDelete(id).lean() as unknown as Promise<any | null>;
}

export async function seedDefaultExercises(
  exercises: Record<string, any>[]
): Promise<{ inserted: number; updated: number; total: number }> {
  await connectToDatabase();

  let inserted = 0;
  let updated = 0;

  const bulkOps = exercises.map((exercise) => ({
    updateOne: {
      filter: { name: exercise.name },
      update: { $set: exercise },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    const result = await Exercise.bulkWrite(bulkOps);
    inserted = result.upsertedCount;
    updated = result.modifiedCount;
  }

  return { inserted, updated, total: exercises.length };
}

export async function getExerciseCount(): Promise<number> {
  await connectToDatabase();
  return Exercise.countDocuments();
}
