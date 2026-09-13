import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateLog } from '@/lib/db/repositories/logRepository';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const log = await updateLog(params.id, session.user.id, body);
    if (!log) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(log);
  } catch (err) {
    console.error('[logs/[id] PUT] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }
}
