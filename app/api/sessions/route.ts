import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSession, getRecentSessions } from '@/lib/db/repositories/sessionRepository';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await getRecentSessions(session.user.id);
    return NextResponse.json(sessions);
  } catch (err) {
    console.error('[sessions GET] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const created = await createSession({
      ...body,
      userId: session.user.id,
      startedAt: new Date(),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[sessions POST] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
