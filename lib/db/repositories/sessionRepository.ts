import connectToDatabase from '@/lib/db/connection';
import WorkoutSession from '@/lib/db/models/WorkoutSession';
import type { IWorkoutSession } from '@/types';

/**
 * Creates a new workout session in the database.
 * @param data - Partial session fields including userId, startedAt, and optional workoutDayId
 * @returns The newly created session document
 */
export async function createSession(data: Partial<IWorkoutSession>): Promise<IWorkoutSession> {
  await connectToDatabase();
  const session = new WorkoutSession(data);
  await session.save();
  return session.toObject() as IWorkoutSession;
}

/**
 * Retrieves a single workout session by ID, scoped to the specified user.
 * @param id - The session's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string (ensures ownership)
 * @returns The matching session document, or null if not found or not owned by the user
 */
export async function getSessionById(id: string, userId: string): Promise<IWorkoutSession | null> {
  await connectToDatabase();
  return WorkoutSession.findOne({ _id: id, userId }).lean() as unknown as Promise<IWorkoutSession | null>;
}

/**
 * Marks a workout session as completed by setting the completedAt timestamp.
 * @param id - The session's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string (ensures ownership)
 * @param notes - Optional completion notes to attach to the session
 * @returns The updated session document with completedAt set, or null if not found
 */
export async function completeSession(id: string, userId: string, notes?: string): Promise<IWorkoutSession | null> {
  await connectToDatabase();
  return WorkoutSession.findOneAndUpdate(
    { _id: id, userId },
    { completedAt: new Date(), notes },
    { new: true }
  ).lean() as unknown as Promise<IWorkoutSession | null>;
}

/**
 * Retrieves the most recent workout sessions for a user, ordered by start time descending.
 * @param userId - The user's MongoDB ObjectId as a string
 * @param limit - Maximum number of sessions to return (default: 10)
 * @returns Array of recent session documents
 */
export async function getRecentSessions(userId: string, limit = 10): Promise<IWorkoutSession[]> {
  await connectToDatabase();
  return WorkoutSession.find({ userId }).sort({ startedAt: -1 }).limit(limit).lean() as unknown as Promise<IWorkoutSession[]>;
}
