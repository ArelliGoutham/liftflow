import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLogsByExercise } from '@/lib/db/repositories/logRepository';

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

    const logs = await getLogsByExercise(session.user.id, exerciseId, 100);
    return NextResponse.json(logs);
  } catch (err) {
    console.error('[progress GET] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
