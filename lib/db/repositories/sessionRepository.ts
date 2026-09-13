import connectToDatabase from '@/lib/db/connection';
import WorkoutSession from '@/lib/db/models/WorkoutSession';
import type { IWorkoutSession } from '@/types';

export async function createSession(data: Partial<IWorkoutSession>): Promise<IWorkoutSession> {
  await connectToDatabase();
  const session = new WorkoutSession(data);
  await session.save();
  return session.toObject() as IWorkoutSession;
}

export async function getSessionById(id: string, userId: string): Promise<IWorkoutSession | null> {
  await connectToDatabase();
  return WorkoutSession.findOne({ _id: id, userId }).lean() as unknown as Promise<IWorkoutSession | null>;
}

export async function completeSession(id: string, userId: string, notes?: string): Promise<IWorkoutSession | null> {
  await connectToDatabase();
  return WorkoutSession.findOneAndUpdate(
    { _id: id, userId },
    { completedAt: new Date(), notes },
    { new: true }
  ).lean() as unknown as Promise<IWorkoutSession | null>;
}

export async function getRecentSessions(userId: string, limit = 10): Promise<IWorkoutSession[]> {
  await connectToDatabase();
  return WorkoutSession.find({ userId }).sort({ startedAt: -1 }).limit(limit).lean() as unknown as Promise<IWorkoutSession[]>;
}
