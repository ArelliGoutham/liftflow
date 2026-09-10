import { NextRequest, NextResponse } from 'next/server';
import { updateLog } from '@/lib/db/repositories/logRepository';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const log = await updateLog(params.id, body);
    if (!log) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(log);
  } catch {
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }
}
