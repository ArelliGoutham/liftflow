import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDashboardData } from '@/lib/services/dashboardService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDashboardData(session.user.id);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[dashboard API] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
