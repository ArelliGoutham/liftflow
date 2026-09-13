import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getExerciseById, updateExercise, deleteExercise } from '@/lib/db/repositories/exerciseRepository';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const exercise = await getExerciseById(params.id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json(exercise);
  } catch (err) {
    console.error('[exercises/[id] GET] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to fetch exercise' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const exercise = await updateExercise(params.id, session.user.id, body);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json(exercise);
  } catch (err) {
    console.error('[exercises/[id] PUT] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exercise = await deleteExercise(params.id, session.user.id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Exercise deleted' });
  } catch (err) {
    console.error('[exercises/[id] DELETE] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
