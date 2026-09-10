import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPlans, createPlan } from '@/lib/db/repositories/planRepository';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await getUserPlans(session.user.id);
    return NextResponse.json(plans);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const plan = await createPlan({
      ...body,
      userId: session.user.id,
    });

    return NextResponse.json(plan, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
