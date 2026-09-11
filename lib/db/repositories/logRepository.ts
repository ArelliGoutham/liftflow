import connectToDatabase from '@/lib/db/connection';
import ExerciseLog from '@/lib/db/models/ExerciseLog';
import type { IExerciseLog } from '@/types';

export async function createLog(data: Partial<IExerciseLog>): Promise<IExerciseLog> {
  await connectToDatabase();
  const log = new ExerciseLog(data);
  await log.save();
  return log.toObject() as IExerciseLog;
}

export async function updateLog(id: string, data: Partial<IExerciseLog>): Promise<IExerciseLog | null> {
  await connectToDatabase();
  return ExerciseLog.findByIdAndUpdate(id, data, { new: true }).lean() as unknown as Promise<IExerciseLog | null>;
}

export async function getLogsBySession(sessionId: string): Promise<IExerciseLog[]> {
  await connectToDatabase();
  return ExerciseLog.find({ sessionId }).sort({ loggedAt: 1 }).lean() as unknown as Promise<IExerciseLog[]>;
}

export async function getLogsByExercise(userId: string, exerciseId: string, limit = 50): Promise<IExerciseLog[]> {
  await connectToDatabase();
  return ExerciseLog.find({ userId, exerciseId }).sort({ loggedAt: -1 }).limit(limit).lean() as unknown as Promise<IExerciseLog[]>;
}
