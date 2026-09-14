import { getUserPlans } from '@/lib/db/repositories/planRepository';
import { getPlanWorkoutDays } from '@/lib/db/repositories/workoutDayRepository';
import { getRecentSessions } from '@/lib/db/repositories/sessionRepository';
import { computeWeekSchedule } from '@/lib/schedule';
import type { IWeekSchedule } from '@/types';

interface DashboardWorkoutDay {
  _id: string;
  planId: string;
  title: string;
  date: string;
  exercises: Array<Record<string, unknown>>;
}

interface DashboardSession {
  _id: string;
  planId: string;
  workoutDayId: string;
  startedAt: string | null;
  completedAt: string | null;
  notes?: string;
}

interface DashboardPlan {
  _id: string;
  name: string;
  goal: string | undefined;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface DashboardData {
  activePlan: DashboardPlan | null;
  workoutDays: DashboardWorkoutDay[];
  recentSessions: DashboardSession[];
  totalWorkouts: number;
  completedWorkouts: number;
  weekSchedule: IWeekSchedule | null;
}

export async function getDashboardData(userId: string, weekOffset: number = 0): Promise<DashboardData> {
  const plans = await getUserPlans(userId);
  const activePlan = plans.find((p: any) => p.isActive) || plans[0];

  let workoutDays: DashboardWorkoutDay[] = [];
  let recentSessions: DashboardSession[] = [];
  let weekSchedule: IWeekSchedule | null = null;

  if (activePlan) {
    const rawWorkoutDays = await getPlanWorkoutDays(activePlan._id.toString());
    workoutDays = (rawWorkoutDays as any[]).map((d: any) => ({
      _id: d._id?.toString() ?? '',
      planId: d.planId?.toString() ?? '',
      title: d.title,
      date: d.date,
      exercises: (d.exercises || []).map((ex: any) => ({
        exerciseId: ex.exerciseId?.toString() ?? '',
        order: ex.order ?? 0,
        trackingMode: ex.trackingMode ?? 'reps',
        targetSets: ex.targetSets ?? 3,
        targetRepetitions: ex.targetRepetitions,
        targetDurationValue: ex.targetDurationValue,
        durationUnit: ex.durationUnit,
        restSeconds: ex.restSeconds ?? 90,
        notes: ex.notes,
      })),
    }));

    const rawSessions = await getRecentSessions(userId, 20);
    recentSessions = (rawSessions as any[]).map((s: any) => ({
      _id: s._id?.toString() ?? '',
      planId: s.planId?.toString() ?? '',
      workoutDayId: s.workoutDayId?.toString() ?? '',
      startedAt: s.startedAt instanceof Date ? s.startedAt.toISOString() : (s.startedAt ?? null),
      completedAt: s.completedAt instanceof Date ? s.completedAt.toISOString() : (s.completedAt ?? null),
      notes: s.notes,
    }));

    const dayInfo = workoutDays.map((d) => ({
      _id: d._id,
      date: d.date,
      title: d.title,
    }));

    const sessionInfo = recentSessions
      .filter((s) => s.startedAt !== null)
      .map((s) => ({
        workoutDayId: s.workoutDayId,
        completedAt: s.completedAt,
        startedAt: s.startedAt as string,
      }));

    weekSchedule = computeWeekSchedule(
      { startDate: activePlan.startDate, endDate: activePlan.endDate },
      dayInfo,
      sessionInfo,
      new Date(),
      weekOffset
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
