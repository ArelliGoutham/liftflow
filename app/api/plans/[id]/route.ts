import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPlanById, updatePlan, deletePlan } from '@/lib/db/repositories/planRepository';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await getPlanById(params.id, session.user.id);
    if (!plan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (err) {
    console.error('[plans/[id] GET] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const plan = await updatePlan(params.id, session.user.id, body);
    if (!plan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (err) {
    console.error('[plans/[id] PUT] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await deletePlan(params.id, session.user.id);
    if (!plan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[plans/[id] DELETE] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
