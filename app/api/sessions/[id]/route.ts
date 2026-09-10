import { NextRequest, NextResponse } from 'next/server';
import { getSessionById, completeSession } from '@/lib/db/repositories/sessionRepository';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionById(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const session = await completeSession(params.id, body.notes);
    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
