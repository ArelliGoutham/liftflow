import { NextRequest, NextResponse } from 'next/server';
import { getWorkoutDayWithExerciseNames, updateWorkoutDay, deleteWorkoutDay } from '@/lib/db/repositories/workoutDayRepository';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const day = await getWorkoutDayWithExerciseNames(params.id);
    if (!day) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(day);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workout day' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const day = await updateWorkoutDay(params.id, body);
    if (!day) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(day);
  } catch {
    return NextResponse.json({ error: 'Failed to update workout day' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const day = await deleteWorkoutDay(params.id);
    if (!day) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete workout day' }, { status: 500 });
  }
}
