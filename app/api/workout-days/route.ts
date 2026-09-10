import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPlanWorkoutDays, createWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = new URL(request.url).searchParams.get('planId');
    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
    }

    const days = await getPlanWorkoutDays(planId);
    return NextResponse.json(days);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workout days' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const day = await createWorkoutDay({
      ...body,
      userId: session.user.id,
    });

    return NextResponse.json(day, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create workout day' }, { status: 500 });
  }
}
