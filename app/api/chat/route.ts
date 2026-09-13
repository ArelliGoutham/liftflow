import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAIProvider } from '@/lib/ai/providerFactory';
import { AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL, SYSTEM_PROMPT } from '@/lib/ai/config';
import { getExternalExercises } from '@/lib/exercises/externalExercises';
import { getChatHistory, saveChatMessage } from '@/lib/db/repositories/chatRepository';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured. Get a free key at https://aistudio.google.com/apikey' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const clientMessages = body.messages || [];
    if (clientMessages.length === 0) {
      const history = await getChatHistory(userId);
      return new Response(JSON.stringify({ messages: history }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allExercises = await getExternalExercises();
    const exerciseSummaries = allExercises.slice(0, 400).map(
      (e: any) => `- ${e.name} (${e.category}, ${e.level || 'unspecified'}, equipment: ${e.equipment || 'bodyweight'}, muscles: ${(e.primaryMuscles || []).join(', ')})`
    ).join('\n');
    const systemPrompt = `${SYSTEM_PROMPT}\n\nHere is a summary of exercises available in the LiftFlow library:\n${exerciseSummaries}`;

    const lastMessage = clientMessages[clientMessages.length - 1];
    const userText = lastMessage?.parts?.find((p: any) => p.type === 'text')?.text || '';
    if (userText) {
      await saveChatMessage(userId, 'user', userText);
    }

    const history = await getChatHistory(userId);
    const modelMessages = history.map((m: any) => ({ role: m.role, content: m.content }));

    const provider = createAIProvider({
      provider: AI_PROVIDER as 'gemini' | 'openai',
      apiKey: GEMINI_API_KEY,
      model: GEMINI_MODEL,
    });

    const result = await provider.streamChat(systemPrompt, modelMessages, {
      temperature: 0.7,
      maxOutputTokens: 500,
      onFinish: async (completion) => {
        if (completion.text) {
          await saveChatMessage(userId, 'assistant', completion.text);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('[chat API] Error:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: 'Chat failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
