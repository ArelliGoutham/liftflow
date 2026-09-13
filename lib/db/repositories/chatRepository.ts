import connectToDatabase from '@/lib/db/connection';
import ChatMessage from '@/lib/db/models/ChatMessage';
import type { IChatMessage, IChatMessageSummary } from '@/types';

export async function getChatHistory(userId: string): Promise<IChatMessageSummary[]> {
  await connectToDatabase();
  const messages = await ChatMessage.find({ userId })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();
  return (messages as unknown as IChatMessage[]).map((m) => ({
    id: m._id.toString(),
    role: m.role,
    content: m.content,
    createdAt: m.createdAt?.toISOString() ?? null,
  }));
}

export async function saveChatMessage(
  userId: string,
  role: string,
  content: string
): Promise<void> {
  await connectToDatabase();
  await ChatMessage.create({ userId, role, content });
}

export async function clearChatHistory(userId: string): Promise<number> {
  await connectToDatabase();
  const result = await ChatMessage.deleteMany({ userId });
  return result.deletedCount || 0;
}
