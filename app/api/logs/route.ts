import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLog, getLogsByExercise, getLogsBySession } from '@/lib/db/repositories/logRepository';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const sessionId = searchParams.get('sessionId');
    const exerciseId = searchParams.get('exerciseId');

    if (sessionId) {
      const logs = await getLogsBySession(sessionId);
      return NextResponse.json(logs);
    }

    if (exerciseId) {
      const logs = await getLogsByExercise(session.user.id, exerciseId);
      return NextResponse.json(logs);
    }

    return NextResponse.json({ error: 'Missing sessionId or exerciseId' }, { status: 400 });
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
