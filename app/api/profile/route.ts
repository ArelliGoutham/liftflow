import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserProfile, updateUserProfile } from '@/lib/db/repositories/userRepository';
import type { IUserProfile } from '@/types';

/**
 * GET handler — returns the authenticated user's profile.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserProfile(session.user.id);
    return NextResponse.json(profile);
  } catch (err) {
    console.error('[profile GET] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * PUT handler — updates the authenticated user's profile fields.
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields: (keyof IUserProfile)[] = [
      'gender',
      'dateOfBirth',
      'heightCm',
      'weightKg',
      'fitnessGoal',
      'experienceLevel',
      'workoutsPerWeek',
      'equipmentAccess',
      'injuries',
      'preferredUnits',
    ];

    const updateData: Partial<IUserProfile> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    }

    const profile = await updateUserProfile(session.user.id, updateData);
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error('[profile PUT] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
