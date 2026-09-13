jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));
jest.mock('@/lib/ai/config', () => ({
  AI_PROVIDER: 'gemini',
  GEMINI_API_KEY: 'test-key',
  GEMINI_MODEL: 'gemini-3.1-flash-lite',
  SYSTEM_PROMPT: 'You are a test assistant.',
}));
jest.mock('@/lib/ai/providerFactory', () => ({
  createAIProvider: jest.fn(),
}));
jest.mock('@/lib/exercises/externalExercises', () => ({
  getExternalExercises: jest.fn(),
}));
jest.mock('@/lib/db/repositories/chatRepository', () => ({
  getChatHistory: jest.fn(),
  saveChatMessage: jest.fn(),
}));

import { POST } from '@/app/api/chat/route';
import { getServerSession } from 'next-auth';
import { createAIProvider } from '@/lib/ai/providerFactory';
import { getExternalExercises } from '@/lib/exercises/externalExercises';
import { getChatHistory, saveChatMessage } from '@/lib/db/repositories/chatRepository';

const mockGetServerSession = jest.mocked(getServerSession);
const mockCreateAIProvider = jest.mocked(createAIProvider);
const mockGetExternalExercises = jest.mocked(getExternalExercises);
const mockGetChatHistory = jest.mocked(getChatHistory);
const mockSaveChatMessage = jest.mocked(saveChatMessage);
const aiConfig = require('@/lib/ai/config');

function mockReq(body: Record<string, unknown>) {
  return {
    url: 'http://localhost/api/chat',
    json: async () => body,
  } as any;
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    aiConfig.GEMINI_API_KEY = 'test-key';
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetExternalExercises.mockResolvedValue([]);
    mockGetChatHistory.mockResolvedValue([]);
    mockSaveChatMessage.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(mockReq({ messages: [] }));

    expect(res.status).toBe(401);
  });

  it('calls AI provider when authenticated with messages', async () => {
    const mockProvider = {
      streamChat: jest.fn().mockResolvedValue({
        toUIMessageStreamResponse: jest.fn().mockReturnValue(new Response('stream')),
      }),
    };
    mockCreateAIProvider.mockReturnValue(mockProvider);

    await POST(
      mockReq({
        messages: [
          { role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        ],
      })
    );

    expect(mockCreateAIProvider).toHaveBeenCalled();
  });

  it('returns chat history when no messages provided', async () => {
    mockGetChatHistory.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'Hello', createdAt: '2026-01-01T00:00:00.000Z' },
    ]);

    const res = await POST(mockReq({ messages: [] }));
    const data = await res.json();

    expect(data.messages).toHaveLength(1);
  });

  it('returns 500 when GEMINI_API_KEY is not configured', async () => {
    aiConfig.GEMINI_API_KEY = '';

    const res = await POST(
      mockReq({
        messages: [
          { role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
        ],
      })
    );
    const data = await res.json();

    expect(res.status).toBe(500);
  });
});
