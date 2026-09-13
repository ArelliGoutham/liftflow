import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clearChatHistory } from '@/lib/db/repositories/chatRepository';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedCount = await clearChatHistory(session.user.id);
    return NextResponse.json({
      message: 'Chat history cleared',
      deleted: deletedCount,
    });
  } catch (err) {
    console.error('[chat/clear DELETE] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to clear chat history' }, { status: 500 });
  }
}
