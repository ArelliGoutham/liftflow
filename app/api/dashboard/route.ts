import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPlans } from '@/lib/db/repositories/planRepository';
import { getPlanWorkoutDays } from '@/lib/db/repositories/workoutDayRepository';
import { getRecentSessions } from '@/lib/db/repositories/sessionRepository';
import { computeWeekSchedule } from '@/lib/schedule';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const plans = await getUserPlans(userId);
    const activePlan = plans.find((p) => p.isActive) || plans[0];

    let workoutDays: any[] = [];
    let recentSessions: any[] = [];
    let weekSchedule = null;

    if (activePlan) {
      workoutDays = await getPlanWorkoutDays(activePlan._id.toString());
      // Serialize Mongoose objects to plain JSON-safe objects
      workoutDays = workoutDays.map((d: any) => ({
        _id: d._id?.toString() ?? '',
        planId: d.planId?.toString() ?? '',
        title: d.title,
        dayOfWeek: d.dayOfWeek,
        weekNumber: d.weekNumber ?? 1,
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

      recentSessions = await getRecentSessions(userId, 20);
      recentSessions = recentSessions.map((s: any) => ({
        _id: s._id?.toString() ?? '',
        planId: s.planId?.toString() ?? '',
        workoutDayId: s.workoutDayId?.toString() ?? '',
        startedAt: s.startedAt?.toISOString() ?? null,
        completedAt: s.completedAt?.toISOString() ?? null,
        notes: s.notes,
      }));

      const dayInfo = workoutDays.map((d) => ({
        _id: d._id,
        dayOfWeek: d.dayOfWeek,
        title: d.title,
        isRest: false,
      }));

      const sessionInfo = recentSessions.map((s) => ({
        workoutDayId: s.workoutDayId,
        completedAt: s.completedAt,
        startedAt: s.startedAt,
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

    // Serialize activePlan to plain JSON-safe object
    const activePlanJson = activePlan ? {
      _id: activePlan._id?.toString() ?? '',
      name: activePlan.name,
      goal: activePlan.goal,
      isActive: activePlan.isActive,
      startDate: activePlan.startDate,
      endDate: activePlan.endDate,
      weeklyAnchor: activePlan.weeklyAnchor,
    } : null;

    const totalWorkouts = recentSessions.length;
    const completedWorkouts = recentSessions.filter((s) => s.completedAt).length;

    return NextResponse.json({
      activePlan: activePlanJson,
      workoutDays,
      recentSessions,
      totalWorkouts,
      completedWorkouts,
      weekSchedule,
    });
  } catch (err) {
    console.error('[dashboard API] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
