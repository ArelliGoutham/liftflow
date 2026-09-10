import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPlans } from '@/lib/db/repositories/planRepository';
import { getPlanWorkoutDays } from '@/lib/db/repositories/workoutDayRepository';
import { getRecentSessions } from '@/lib/db/repositories/sessionRepository';

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

    if (activePlan) {
      workoutDays = await getPlanWorkoutDays(activePlan._id.toString());
      recentSessions = await getRecentSessions(userId, 5);
    }

    const totalWorkouts = recentSessions.length;
    const completedWorkouts = recentSessions.filter((s) => s.completedAt).length;

    return NextResponse.json({
      activePlan: activePlan || null,
      workoutDays,
      recentSessions,
      totalWorkouts,
      completedWorkouts,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
