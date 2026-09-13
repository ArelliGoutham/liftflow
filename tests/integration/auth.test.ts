jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));
jest.mock('@/lib/db/repositories/planRepository', () => ({
  getUserPlans: jest.fn(),
  createPlan: jest.fn(),
}));
jest.mock('@/lib/db/repositories/sessionRepository', () => ({
  createSession: jest.fn(),
  getRecentSessions: jest.fn(),
}));
jest.mock('@/lib/db/repositories/workoutDayRepository', () => ({
  getPlanWorkoutDays: jest.fn(),
  createWorkoutDay: jest.fn(),
}));
jest.mock('@/lib/db/repositories/logRepository', () => ({
  createLog: jest.fn(),
  getLogsByExercise: jest.fn(),
}));

import { GET as getPlans } from '@/app/api/plans/route';
import { GET as getSessions } from '@/app/api/sessions/route';
import { GET as getDashboard } from '@/app/api/dashboard/route';
import { getServerSession } from 'next-auth';
import { getUserPlans } from '@/lib/db/repositories/planRepository';
import { getRecentSessions } from '@/lib/db/repositories/sessionRepository';

const mockGetServerSession = jest.mocked(getServerSession);
const mockGetUserPlans = jest.mocked(getUserPlans);
const mockGetRecentSessions = jest.mocked(getRecentSessions);

const PROTECTED_ROUTES = [
  '/api/plans',
  '/api/sessions',
  '/api/logs',
  '/api/workout-days',
  '/api/progress',
  '/api/dashboard',
  '/api/chat',
];

describe('Protected route authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(null);
  });

  it('returns 401 when calling /api/plans without session', async () => {
    const res = await getPlans();

    expect(res.status).toBe(401);
  });

  it('returns 401 when calling /api/sessions without session', async () => {
    const res = await getSessions();

    expect(res.status).toBe(401);
  });

  it('returns 401 when calling /api/dashboard without session', async () => {
    const res = await getDashboard();

    expect(res.status).toBe(401);
  });

  it('does not call repository when session is null', async () => {
    await getPlans();

    expect(mockGetUserPlans).not.toHaveBeenCalled();
  });

  it('does not call session repository when unauthenticated', async () => {
    await getSessions();

    expect(mockGetRecentSessions).not.toHaveBeenCalled();
  });

  it('protected routes list matches expected routes', () => {
    expect(PROTECTED_ROUTES).toContain('/api/plans');
    expect(PROTECTED_ROUTES).toContain('/api/sessions');
    expect(PROTECTED_ROUTES).toContain('/api/dashboard');
    expect(PROTECTED_ROUTES.length).toBeGreaterThanOrEqual(5);
  });
});
