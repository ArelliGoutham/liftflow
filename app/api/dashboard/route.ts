import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDashboardData } from '@/lib/services/dashboardService';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0') || 0;

    const data = await getDashboardData(session.user.id, weekOffset);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[dashboard API] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
