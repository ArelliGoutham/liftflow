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

import { GET, POST } from '@/app/api/plans/route';
import { getServerSession } from 'next-auth';
import { getUserPlans, createPlan } from '@/lib/db/repositories/planRepository';

const mockGetServerSession = jest.mocked(getServerSession);
const mockGetUserPlans = jest.mocked(getUserPlans);
const mockCreatePlan = jest.mocked(createPlan);

function mockReq(url: string, body?: Record<string, unknown>) {
  if (body) {
    return { url, json: async () => body } as any;
  }
  return { url } as any;
}

describe('GET /api/plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('returns plans for authenticated user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetUserPlans.mockResolvedValue([
      { _id: 'p1', name: 'Plan A', isActive: true },
      { _id: 'p2', name: 'Plan B', isActive: false },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(data).toHaveLength(2);
  });

  it('passes session user id to repository for user isolation', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-42' } });
    mockGetUserPlans.mockResolvedValue([]);

    await GET();

    expect(mockGetUserPlans).toHaveBeenCalledWith('user-42');
  });
});

describe('POST /api/plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(mockReq('http://localhost/api/plans', { name: 'New Plan' }));

    expect(res.status).toBe(401);
  });

  it('passes body and session user id to createPlan', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockCreatePlan.mockResolvedValue({ _id: 'p1', name: 'New Plan', userId: 'user-1' });

    await POST(mockReq('http://localhost/api/plans', { name: 'New Plan', goal: 'strength' }));

    expect(mockCreatePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Plan',
        goal: 'strength',
        userId: 'user-1',
      })
    );
  });
});
