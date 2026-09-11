import connectToDatabase from '@/lib/db/connection';
import WorkoutDay from '@/lib/db/models/WorkoutDay';
import Exercise from '@/lib/db/models/Exercise';
import type { IWorkoutDay, IWorkoutExercise } from '@/types';

export async function getPlanWorkoutDays(planId: string): Promise<IWorkoutDay[]> {
  await connectToDatabase();
  return WorkoutDay.find({ planId }).sort({ weekNumber: 1, dayOfWeek: 1 }).lean() as Promise<IWorkoutDay[]>;
}

export async function getWorkoutDayById(id: string): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  const day = await WorkoutDay.findById(id).lean();
  if (!day) return null;
  return day as unknown as IWorkoutDay;
}

export async function getWorkoutDayWithExerciseNames(id: string): Promise<any | null> {
  await connectToDatabase();
  const day = await WorkoutDay.findById(id).lean() as any;
  if (!day) return null;

  if (day.exercises && day.exercises.length > 0) {
    const exerciseIds = day.exercises.map((ex: any) => ex.exerciseId);
    const exercises = await Exercise.find({ _id: { $in: exerciseIds } }).select('name category').lean();
    const nameMap = new Map(exercises.map((e: any) => [e._id.toString(), e.name]));

    day.exercises = day.exercises.map((ex: any) => ({
      ...ex,
      exerciseId: ex.exerciseId?.toString() ?? '',
      exerciseName: nameMap.get(ex.exerciseId?.toString() ?? '') ?? 'Unknown exercise',
    }));
  }

  return day;
}

export async function createWorkoutDay(data: Partial<IWorkoutDay>): Promise<IWorkoutDay> {
  await connectToDatabase();
  const day = new WorkoutDay(data);
  await day.save();
  return day.toObject() as IWorkoutDay;
}

export async function updateWorkoutDay(id: string, data: Partial<IWorkoutDay>): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  return WorkoutDay.findByIdAndUpdate(id, data, { new: true }).lean() as Promise<IWorkoutDay | null>;
}

export async function deleteWorkoutDay(id: string): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  return WorkoutDay.findByIdAndDelete(id).lean() as Promise<IWorkoutDay | null>;
}

export async function deletePlanWorkoutDays(planId: string): Promise<void> {
  await connectToDatabase();
  await WorkoutDay.deleteMany({ planId });
}
