import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getAllExercises,
  createExercise,
  seedDefaultExercises,
} from '@/lib/db/repositories/exerciseRepository';
import defaultExercises from '@/lib/exercises/defaultExercises';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const sharedOnly = searchParams.get('sharedOnly') === 'true';

    const exercises = await getAllExercises({ category, sharedOnly });
    return NextResponse.json(exercises);
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
    await seedDefaultExercises(defaultExercises);
    return NextResponse.json({ message: 'Default exercises seeded' });
  } catch {
    return NextResponse.json({ error: 'Failed to seed exercises' }, { status: 500 });
  }
}
