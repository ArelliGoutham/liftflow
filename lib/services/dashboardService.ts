import { getUserPlans } from '@/lib/db/repositories/planRepository';
import { getPlanWorkoutDays } from '@/lib/db/repositories/workoutDayRepository';
import { getRecentSessions } from '@/lib/db/repositories/sessionRepository';
import { computeWeekSchedule } from '@/lib/schedule';
import type { IWeekSchedule } from '@/types';

/** JSON-safe serialized workout day shape returned to the dashboard. */
interface DashboardWorkoutDay {
  _id: string;
  planId: string;
  title: string;
  dayOfWeek: number;
  weekNumber: number;
  exercises: Array<{
    exerciseId: string;
    order: number;
    trackingMode: string;
    targetSets: number;
    targetRepetitions?: number;
    targetDurationValue?: number;
    durationUnit?: string;
    restSeconds: number;
    notes?: string;
  }>;
}

/** JSON-safe serialized workout session shape returned to the dashboard. */
interface DashboardSession {
  _id: string;
  planId: string;
  workoutDayId: string;
  startedAt: string | null;
  completedAt: string | null;
  notes?: string;
}

/** JSON-safe serialized active plan shape returned to the dashboard. */
interface DashboardPlan {
  _id: string;
  name: string;
  goal: string | undefined;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  weeklyAnchor?: number;
}

/** Aggregated dashboard data returned by getDashboardData. */
export interface DashboardData {
  activePlan: DashboardPlan | null;
  workoutDays: DashboardWorkoutDay[];
  recentSessions: DashboardSession[];
  totalWorkouts: number;
  completedWorkouts: number;
  weekSchedule: IWeekSchedule | null;
}

/**
 * Serializes an array of Mongoose workout day documents to JSON-safe objects.
 * @param days - Array of raw Mongoose workout day documents
 * @returns Array of JSON-safe workout day objects with string IDs and nested exercises
 */
function serializeWorkoutDays(days: Record<string, unknown>[]): DashboardWorkoutDay[] {
  return days.map((d) => ({
    _id: (d._id as { toString(): string })?.toString() ?? '',
    planId: (d.planId as { toString(): string })?.toString() ?? '',
    title: d.title as string,
    dayOfWeek: d.dayOfWeek as number,
    weekNumber: (d.weekNumber as number) ?? 1,
    exercises: (d.exercises as Record<string, unknown>[] || []).map((ex) => ({
      exerciseId: (ex.exerciseId as { toString(): string })?.toString() ?? '',
      order: (ex.order as number) ?? 0,
      trackingMode: (ex.trackingMode as string) ?? 'reps',
      targetSets: (ex.targetSets as number) ?? 3,
      targetRepetitions: ex.targetRepetitions as number | undefined,
      targetDurationValue: ex.targetDurationValue as number | undefined,
      durationUnit: ex.durationUnit as string | undefined,
      restSeconds: (ex.restSeconds as number) ?? 90,
      notes: ex.notes as string | undefined,
    })),
  }));
}

/**
 * Serializes an array of Mongoose workout session documents to JSON-safe objects.
 * @param sessions - Array of raw Mongoose workout session documents
 * @returns Array of JSON-safe session objects with ISO date strings
 */
function serializeSessions(sessions: Record<string, unknown>[]): DashboardSession[] {
  return sessions.map((s) => ({
    _id: (s._id as { toString(): string })?.toString() ?? '',
    planId: (s.planId as { toString(): string })?.toString() ?? '',
    workoutDayId: (s.workoutDayId as { toString(): string })?.toString() ?? '',
    startedAt: (s.startedAt as Date)?.toISOString() ?? null,
    completedAt: (s.completedAt as Date)?.toISOString() ?? null,
    notes: s.notes as string | undefined,
  }));
}

/**
 * Aggregates all data needed for the dashboard view for a given user.
 * @param userId - The authenticated user's MongoDB ObjectId as a string
 * @returns Promise resolving to dashboard data including active plan, workout days, recent sessions, and computed week schedule
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const plans = await getUserPlans(userId);
  const activePlan = plans.find((p) => p.isActive) || plans[0];

  let workoutDays: DashboardWorkoutDay[] = [];
  let recentSessions: DashboardSession[] = [];
  let weekSchedule: IWeekSchedule | null = null;

  if (activePlan) {
    const rawWorkoutDays = await getPlanWorkoutDays(activePlan._id.toString());
    workoutDays = serializeWorkoutDays(rawWorkoutDays as unknown as Record<string, unknown>[]);

    const rawSessions = await getRecentSessions(userId, 20);
    recentSessions = serializeSessions(rawSessions as unknown as Record<string, unknown>[]);

    const dayInfo = workoutDays.map((d) => ({
      _id: d._id,
      dayOfWeek: d.dayOfWeek,
      title: d.title,
      isRest: false,
    }));

    const sessionInfo = recentSessions
      .filter((s) => s.startedAt !== null)
      .map((s) => ({
        workoutDayId: s.workoutDayId,
        completedAt: s.completedAt,
        startedAt: s.startedAt as string,
      }));

    weekSchedule = computeWeekSchedule(
      {
        startDate: activePlan.startDate,
        endDate: activePlan.endDate,
        weeklyAnchor: activePlan.weeklyAnchor,
      },
      dayInfo,
      sessionInfo
    );

    recentSessions = recentSessions.slice(0, 5);
  }

  const activePlanJson: DashboardPlan | null = activePlan
    ? {
        _id: activePlan._id?.toString() ?? '',
        name: activePlan.name,
        goal: activePlan.goal,
        isActive: activePlan.isActive,
        startDate: activePlan.startDate,
        endDate: activePlan.endDate,
        weeklyAnchor: activePlan.weeklyAnchor,
      }
    : null;

  const totalWorkouts = recentSessions.length;
  const completedWorkouts = recentSessions.filter((s) => s.completedAt).length;

  return {
    activePlan: activePlanJson,
    workoutDays,
    recentSessions,
    totalWorkouts,
    completedWorkouts,
    weekSchedule,
  };
}
