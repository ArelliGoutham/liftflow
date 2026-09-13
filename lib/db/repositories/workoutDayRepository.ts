import connectToDatabase from '@/lib/db/connection';
import WorkoutDay from '@/lib/db/models/WorkoutDay';
import Exercise from '@/lib/db/models/Exercise';
import { isMongoId } from '@/lib/utils';
import type { IWorkoutDay, IWorkoutDayWithNames, IExternalExercise } from '@/types';

/**
 * Retrieves all workout days for a plan, sorted by week number then day of week.
 * @param planId - The plan's MongoDB ObjectId as a string
 * @returns Array of workout day documents belonging to the plan
 */
export async function getPlanWorkoutDays(planId: string): Promise<IWorkoutDay[]> {
  await connectToDatabase();
  return WorkoutDay.find({ planId }).sort({ weekNumber: 1, dayOfWeek: 1 }).lean() as unknown as Promise<IWorkoutDay[]>;
}

/**
 * Retrieves a single workout day by ID, optionally scoped to a user.
 * @param id - The workout day's MongoDB ObjectId as a string
 * @param userId - Optional user's MongoDB ObjectId to enforce ownership
 * @returns The matching workout day document, or null if not found
 */
export async function getWorkoutDayById(id: string, userId?: string): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  const query: Record<string, unknown> = { _id: id };
  if (userId) query.userId = userId;
  const day = await WorkoutDay.findOne(query).lean();
  if (!day) return null;
  return day as unknown as IWorkoutDay;
}

/**
 * Retrieves a workout day with exercise names resolved from both the database and external CDN.
 * @param id - The workout day's MongoDB ObjectId as a string
 * @param userId - Optional user's MongoDB ObjectId to enforce ownership
 * @returns The workout day with exerciseName populated on each exercise entry, or null if not found
 */
export async function getWorkoutDayWithExerciseNames(id: string, userId?: string): Promise<IWorkoutDayWithNames | null> {
  await connectToDatabase();
  const query: Record<string, unknown> = { _id: id };
  if (userId) query.userId = userId;
  const day = await WorkoutDay.findOne(query).lean() as unknown as IWorkoutDayWithNames | null;
  if (!day) return null;

  if (day.exercises && day.exercises.length > 0) {
    // Separate Mongo IDs from external (string) IDs
    const mongoIds: string[] = [];
    const externalIds: string[] = [];

    for (const ex of day.exercises) {
      const exId = ex.exerciseId?.toString() ?? '';
      if (isMongoId(exId)) {
        mongoIds.push(exId);
      } else {
        externalIds.push(exId);
      }
    }

    // Fetch Mongo exercise names from database
    const mongoNames = new Map<string, string>();
    if (mongoIds.length > 0) {
      const exercises = await Exercise.find({ _id: { $in: mongoIds } })
        .select('name')
        .lean();
      for (const e of exercises as Array<{ _id: { toString(): string }; name?: string }>) {
        mongoNames.set(e._id.toString(), e.name ?? '');
      }
    }

    // Fetch external exercise names from CDN
    const externalNames = new Map<string, string>();
    if (externalIds.length > 0) {
      try {
        const { getExternalExercises } = await import('@/lib/exercises/externalExercises');
        const allExternal = await getExternalExercises();
        for (const ex of allExternal as IExternalExercise[]) {
          const eid = ex._id || ex.id || '';
          const sid = ex.sourceIds?.freeExerciseDb || '';
          const rid = ex.sourceIds?.repdb || '';
          const name = ex.name || '';
          if (externalIds.includes(eid) || externalIds.includes(sid) || externalIds.includes(rid)) {
            externalNames.set(eid, name);
            externalNames.set(sid, name);
            externalNames.set(rid, name);
          }
        }
      } catch {
        // If CDN fetch fails, we'll just show the raw ID
      }
    }

    // Combine names
    const allNames = new Map<string, string>();
    mongoNames.forEach((v, k) => allNames.set(k, v));
    externalNames.forEach((v, k) => allNames.set(k, v));

    day.exercises = day.exercises.map((ex) => {
      const exId = ex.exerciseId?.toString() ?? '';
      return {
        ...ex,
        exerciseId: exId,
        exerciseName: allNames.get(exId) ?? exId,
      };
    });
  }

  return day;
}

/**
 * Creates a new workout day document in the database.
 * @param data - Partial workout day fields including planId, dayOfWeek, and exercises
 * @returns The newly created workout day document
 */
export async function createWorkoutDay(data: Partial<IWorkoutDay>): Promise<IWorkoutDay> {
  await connectToDatabase();
  const day = new WorkoutDay(data);
  await day.save();
  return day.toObject() as IWorkoutDay;
}

/**
 * Updates a workout day owned by the specified user.
 * @param id - The workout day's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string (ensures ownership)
 * @param data - Partial workout day fields to update
 * @returns The updated workout day document, or null if not found or not owned by the user
 */
export async function updateWorkoutDay(id: string, userId: string, data: Partial<IWorkoutDay>): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  return WorkoutDay.findOneAndUpdate({ _id: id, userId }, data, { new: true }).lean() as unknown as Promise<IWorkoutDay | null>;
}

/**
 * Deletes a workout day owned by the specified user.
 * @param id - The workout day's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string (ensures ownership)
 * @returns The deleted workout day document, or null if not found or not owned by the user
 */
export async function deleteWorkoutDay(id: string, userId: string): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  return WorkoutDay.findOneAndDelete({ _id: id, userId }).lean() as unknown as Promise<IWorkoutDay | null>;
}

/**
 * Deletes all workout days belonging to a plan.
 * @param planId - The plan's MongoDB ObjectId as a string
 * @returns Promise that resolves when all workout days for the plan have been deleted
 */
export async function deletePlanWorkoutDays(planId: string): Promise<void> {
  await connectToDatabase();
  await WorkoutDay.deleteMany({ planId });
}
