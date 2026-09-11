import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createExercise } from '@/lib/db/repositories/exerciseRepository';
import { getExternalExercises } from '@/lib/exercises/externalExercises';
import defaultExercises from '@/lib/exercises/defaultExercises';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const sharedOnly = searchParams.get('sharedOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '200');

    let exercises = await getExternalExercises();

    // Normalize: external exercises use "id" field, map to "_id" for client compatibility
    exercises = exercises.map((e: any) => ({
      ...e,
      _id: e._id || e.id,
    }));

    // Also include user-created exercises from MongoDB
    const { getAllExercises } = await import('@/lib/db/repositories/exerciseRepository');
    const dbExercises = await getAllExercises({ category, sharedOnly });
    const dbNormalized = dbExercises.map((e: any) => ({
      ...e,
      _id: e._id?.toString(),
      sourceIds: e.sourceIds || {},
    }));

    const seen = new Set<string>();
    const merged: any[] = [];

    for (const ex of [...dbNormalized, ...exercises]) {
      const key = ex.name?.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(ex);
      }
    }

    // Apply filters
    let result = merged;
    if (category) {
      result = result.filter((e) => e.category === category);
    }
    if (sharedOnly) {
      result = result.filter((e) => e.isShared !== false);
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
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

    const result = await seedDefaultExercises(defaultExercises as any[]);
    const totalCount = await getExerciseCount();
    return NextResponse.json({
      message: 'Default exercises seeded (hand-written set only)',
      seeded: result.total,
      inserted: result.inserted,
      updated: result.updated,
      totalInDatabase: totalCount,
      note: 'External exercises from free-exercise-db are fetched at runtime, not stored in MongoDB',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to seed exercises' }, { status: 500 });
  }
}
