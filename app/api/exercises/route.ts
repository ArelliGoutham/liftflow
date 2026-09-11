import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getAllExercises,
  createExercise,
  seedDefaultExercises,
  getExerciseCount,
} from '@/lib/db/repositories/exerciseRepository';
import combinedExercises from '@/lib/exercises/combinedExercises';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const sharedOnly = searchParams.get('sharedOnly') === 'true';
    const muscle = searchParams.get('muscle') || undefined;
    const equipment = searchParams.get('equipment') || undefined;
    const level = searchParams.get('level') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const exercises = await getAllExercises({ category, sharedOnly, muscle, equipment, level, search });

    let result = exercises;
    if (search) {
      result = result.filter((e) =>
        e.name.toLowerCase().includes(search!.toLowerCase())
      );
    }
    result = result.slice(0, limit);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const exercise = await createExercise({
      ...body,
      ownerUserId: session.user.id,
      isShared: false,
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized — sign in to seed exercises' },
        { status: 401 }
      );
    }

    const result = await seedDefaultExercises(combinedExercises as any[]);
    const totalCount = await getExerciseCount();
    return NextResponse.json({
      message: 'Exercises seeded successfully',
      seeded: result.total,
      inserted: result.inserted,
      updated: result.updated,
      totalInDatabase: totalCount,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to seed exercises' }, { status: 500 });
  }
}
