jest.mock('@/lib/exercises/externalExercises', () => ({
  getExternalExercises: jest.fn(),
}));
jest.mock('@/lib/db/repositories/exerciseRepository', () => ({
  getAllExercises: jest.fn(),
  createExercise: jest.fn(),
}));
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { GET, POST } from '@/app/api/exercises/route';
import { getExternalExercises } from '@/lib/exercises/externalExercises';
import { getAllExercises, createExercise } from '@/lib/db/repositories/exerciseRepository';
import { getServerSession } from 'next-auth';

const mockGetExternalExercises = jest.mocked(getExternalExercises);
const mockGetAllExercises = jest.mocked(getAllExercises);
const mockCreateExercise = jest.mocked(createExercise);
const mockGetServerSession = jest.mocked(getServerSession);

function mockReq(url: string, body?: Record<string, unknown>) {
  if (body) {
    return { url, json: async () => body } as any;
  }
  return { url } as any;
}

describe('GET /api/exercises', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExternalExercises.mockResolvedValue([]);
    mockGetAllExercises.mockResolvedValue([]);
  });

  it('returns an array of exercises', async () => {
    mockGetExternalExercises.mockResolvedValue([
      { id: '1', name: 'Bench Press', category: 'upper-body' },
      { id: '2', name: 'Squat', category: 'lower-body' },
    ]);

    const res = await GET(mockReq('http://localhost/api/exercises'));
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
  });

  it('filters results by category query param', async () => {
    mockGetExternalExercises.mockResolvedValue([
      { id: '1', name: 'Bench Press', category: 'upper-body' },
      { id: '2', name: 'Squat', category: 'lower-body' },
      { id: '3', name: 'Overhead Press', category: 'upper-body' },
    ]);

    const res = await GET(mockReq('http://localhost/api/exercises?category=upper-body'));
    const data = await res.json();

    expect(data.every((e: any) => e.category === 'upper-body')).toBe(true);
  });

  it('applies sharedOnly filter to exclude private exercises', async () => {
    mockGetExternalExercises.mockResolvedValue([
      { id: '1', name: 'Alpha', category: 'upper-body', isShared: true },
      { id: '2', name: 'Beta', category: 'upper-body', isShared: false },
    ]);

    const res = await GET(mockReq('http://localhost/api/exercises?sharedOnly=true'));
    const data = await res.json();

    expect(data).toHaveLength(1);
  });

  it('maps external exercise id to _id field', async () => {
    mockGetExternalExercises.mockResolvedValue([
      { id: 'ext-123', name: 'Bench Press', category: 'upper-body' },
    ]);

    const res = await GET(mockReq('http://localhost/api/exercises'));
    const data = await res.json();

    expect(data[0]._id).toBe('ext-123');
  });

  it('limits the number of results', async () => {
    mockGetExternalExercises.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        id: `e${i}`,
        name: `Exercise ${String.fromCharCode(65 + i)}`,
        category: 'upper-body',
      }))
    );

    const res = await GET(mockReq('http://localhost/api/exercises?limit=2'));
    const data = await res.json();

    expect(data).toHaveLength(2);
  });
});

describe('POST /api/exercises', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(
      mockReq('http://localhost/api/exercises', { name: 'Custom Exercise', category: 'upper-body' })
    );

    expect(res.status).toBe(401);
  });

  it('passes ownerUserId from session to createExercise', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockCreateExercise.mockResolvedValue({ _id: 'new-1', name: 'Custom Exercise' });

    await POST(
      mockReq('http://localhost/api/exercises', { name: 'Custom Exercise', category: 'upper-body' })
    );

    expect(mockCreateExercise).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Exercise',
        ownerUserId: 'user-1',
        isShared: false,
      })
    );
  });
});
