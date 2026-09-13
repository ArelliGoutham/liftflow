import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLog, getLogsByExercise } from '@/lib/db/repositories/logRepository';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exerciseId = new URL(request.url).searchParams.get('exerciseId');
    if (!exerciseId) {
      return NextResponse.json({ error: 'Missing exerciseId' }, { status: 400 });
    }

    const logs = await getLogsByExercise(session.user.id, exerciseId);
    return NextResponse.json(logs);
  } catch (err) {
    console.error('[logs GET] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const log = await createLog({
      ...body,
      userId: session.user.id,
      loggedAt: new Date(),
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error('[logs POST] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
