import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSessionById, completeSession } from '@/lib/db/repositories/sessionRepository';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workoutSession = await getSessionById(params.id, session.user.id);
    if (!workoutSession) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(workoutSession);
  } catch (err) {
    console.error('[sessions/[id] GET] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const completed = await completeSession(params.id, session.user.id, body.notes);
    if (!completed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(completed);
  } catch (err) {
    console.error('[sessions/[id] PUT] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
