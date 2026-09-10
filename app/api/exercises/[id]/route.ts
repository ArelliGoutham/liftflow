import { NextRequest, NextResponse } from 'next/server';
import { getExerciseById, updateExercise, deleteExercise } from '@/lib/db/repositories/exerciseRepository';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const exercise = await getExerciseById(params.id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json(exercise);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch exercise' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const exercise = await updateExercise(params.id, body);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json(exercise);
  } catch {
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const exercise = await deleteExercise(params.id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Exercise deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
