import connectToDatabase from '@/lib/db/connection';
import ChatMessage from '@/lib/db/models/ChatMessage';
import type { IChatMessage, IChatMessageSummary } from '@/types';

/**
 * Retrieves the chat message history for a user, ordered oldest to newest.
 * @param userId - The user's MongoDB ObjectId as a string
 * @returns Array of chat message summaries (id, role, content, createdAt), limited to 100
 */
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

/**
 * Saves a chat message to the database for a user.
 * @param userId - The user's MongoDB ObjectId as a string
 * @param role - The message role (e.g. "user" or "assistant")
 * @param content - The message content text
 * @returns Promise that resolves when the message has been saved
 */
export async function saveChatMessage(
  userId: string,
  role: string,
  content: string
): Promise<void> {
  await connectToDatabase();
  await ChatMessage.create({ userId, role, content });
}

/**
 * Deletes all chat messages for a user.
 * @param userId - The user's MongoDB ObjectId as a string
 * @returns The number of deleted chat messages
 */
export async function clearChatHistory(userId: string): Promise<number> {
  await connectToDatabase();
  const result = await ChatMessage.deleteMany({ userId });
  return result.deletedCount || 0;
}
