import connectToDatabase from '@/lib/db/connection';
import WorkoutDay from '@/lib/db/models/WorkoutDay';
import Exercise from '@/lib/db/models/Exercise';
import type { IWorkoutDay } from '@/types';

export async function getPlanWorkoutDays(planId: string): Promise<IWorkoutDay[]> {
  await connectToDatabase();
  return WorkoutDay.find({ planId }).sort({ weekNumber: 1, dayOfWeek: 1 }).lean() as unknown as Promise<IWorkoutDay[]>;
}

export async function getWorkoutDayById(id: string): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  const day = await WorkoutDay.findById(id).lean();
  if (!day) return null;
  return day as unknown as IWorkoutDay;
}

function isMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function getWorkoutDayWithExerciseNames(id: string): Promise<any | null> {
  await connectToDatabase();
  const day = await WorkoutDay.findById(id).lean() as any;
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
      for (const e of exercises as any[]) {
        mongoNames.set(e._id.toString(), e.name);
      }
    }

    // Fetch external exercise names from CDN
    const externalNames = new Map<string, string>();
    if (externalIds.length > 0) {
      try {
    const { getExternalExercises } = await import('@/lib/exercises/externalExercises');
        const allExternal = await getExternalExercises();
        for (const ex of allExternal) {
          const eid = (ex as any)._id || (ex as any).id || '';
          const sid = (ex as any).sourceIds?.freeExerciseDb || '';
          const rid = (ex as any).sourceIds?.repdb || '';
          const name = (ex as any).name || '';
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
    const allNames = new Map<string, string>([...mongoNames, ...externalNames]);

    day.exercises = day.exercises.map((ex: any) => {
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

export async function createWorkoutDay(data: Partial<IWorkoutDay>): Promise<IWorkoutDay> {
  await connectToDatabase();
  const day = new WorkoutDay(data);
  await day.save();
  return day.toObject() as IWorkoutDay;
}

export async function updateWorkoutDay(id: string, data: Partial<IWorkoutDay>): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  return WorkoutDay.findByIdAndUpdate(id, data, { new: true }).lean() as unknown as Promise<IWorkoutDay | null>;
}

export async function deleteWorkoutDay(id: string): Promise<IWorkoutDay | null> {
  await connectToDatabase();
  return WorkoutDay.findByIdAndDelete(id).lean() as unknown as Promise<IWorkoutDay | null>;
}

export async function deletePlanWorkoutDays(planId: string): Promise<void> {
  await connectToDatabase();
  await WorkoutDay.deleteMany({ planId });
}
