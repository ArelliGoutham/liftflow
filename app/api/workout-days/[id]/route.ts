import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWorkoutDayWithExerciseNames, updateWorkoutDay, deleteWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const day = await getWorkoutDayWithExerciseNames(params.id, session.user.id);
    if (!day) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(day);
  } catch (err) {
    console.error('[workout-days/[id] GET] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to fetch workout day' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const day = await updateWorkoutDay(params.id, session.user.id, body);
    if (!day) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(day);
  } catch (err) {
    console.error('[workout-days/[id] PUT] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update workout day' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const day = await deleteWorkoutDay(params.id, session.user.id);
    if (!day) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[workout-days/[id] DELETE] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete workout day' }, { status: 500 });
  }
}
