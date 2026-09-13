import connectToDatabase from '@/lib/db/connection';
import ExerciseLog from '@/lib/db/models/ExerciseLog';
import type { IExerciseLog } from '@/types';

/**
 * Creates a new exercise log entry in the database.
 * @param data - Partial log fields including sessionId, exerciseId, and logged sets
 * @returns The newly created exercise log document
 */
export async function createLog(data: Partial<IExerciseLog>): Promise<IExerciseLog> {
  await connectToDatabase();
  const log = new ExerciseLog(data);
  await log.save();
  return log.toObject() as IExerciseLog;
}

/**
 * Updates an exercise log owned by the specified user.
 * @param id - The log's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string (ensures ownership)
 * @param data - Partial log fields to update
 * @returns The updated log document, or null if not found or not owned by the user
 */
export async function updateLog(id: string, userId: string, data: Partial<IExerciseLog>): Promise<IExerciseLog | null> {
  await connectToDatabase();
  return ExerciseLog.findOneAndUpdate({ _id: id, userId }, data, { new: true }).lean() as unknown as Promise<IExerciseLog | null>;
}

/**
 * Retrieves all exercise logs for a session, ordered by log time ascending.
 * @param sessionId - The session's MongoDB ObjectId as a string
 * @returns Array of exercise log documents for the session
 */
export async function getLogsBySession(sessionId: string): Promise<IExerciseLog[]> {
  await connectToDatabase();
  return ExerciseLog.find({ sessionId }).sort({ loggedAt: 1 }).lean() as unknown as Promise<IExerciseLog[]>;
}

/**
 * Retrieves recent exercise logs for a specific user and exercise, ordered by log time descending.
 * @param userId - The user's MongoDB ObjectId as a string
 * @param exerciseId - The exercise's identifier (MongoDB ObjectId or external ID) as a string
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Array of exercise log documents for the user and exercise
 */
export async function getLogsByExercise(userId: string, exerciseId: string, limit = 50): Promise<IExerciseLog[]> {
  await connectToDatabase();
  return ExerciseLog.find({ userId, exerciseId }).sort({ loggedAt: -1 }).limit(limit).lean() as unknown as Promise<IExerciseLog[]>;
}
