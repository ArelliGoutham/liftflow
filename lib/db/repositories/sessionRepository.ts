import connectToDatabase from '@/lib/db/connection';
import WorkoutSession from '@/lib/db/models/WorkoutSession';
import type { IWorkoutSession } from '@/types';

export async function createSession(data: Partial<IWorkoutSession>): Promise<IWorkoutSession> {
  await connectToDatabase();
  const session = new WorkoutSession(data);
  await session.save();
  return session.toObject() as IWorkoutSession;
}

export async function getSessionById(id: string): Promise<IWorkoutSession | null> {
  await connectToDatabase();
  return WorkoutSession.findById(id).lean() as Promise<IWorkoutSession | null>;
}

export async function completeSession(id: string, notes?: string): Promise<IWorkoutSession | null> {
  await connectToDatabase();
  return WorkoutSession.findByIdAndUpdate(
    id,
    { completedAt: new Date(), notes },
    { new: true }
  ).lean() as Promise<IWorkoutSession | null>;
}

export async function getRecentSessions(userId: string, limit = 10): Promise<IWorkoutSession[]> {
  await connectToDatabase();
  return WorkoutSession.find({ userId }).sort({ startedAt: -1 }).limit(limit).lean() as Promise<IWorkoutSession[]>;
}
