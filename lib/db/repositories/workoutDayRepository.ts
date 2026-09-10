import connectToDatabase from '@/lib/db/connection';
import WorkoutDay from '@/lib/db/models/WorkoutDay';
import type { IWorkoutDay, IWorkoutExercise } from '@/types';

export async function getPlanWorkoutDays(planId: string): Promise<IWorkoutDay[]> {
  await connectToDatabase();
  return WorkoutDay.find({ planId }).sort({ weekNumber: 1, dayOfWeek: 1 }).lean() as Promise<IWorkoutDay[]>;
}

export async function getWorkoutDayById(id: string): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  return WorkoutDay.findById(id).lean() as Promise<IWorkoutDay | null>;
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
