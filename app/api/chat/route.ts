import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GEMINI_API_KEY, GEMINI_MODEL, SYSTEM_PROMPT } from '@/lib/ai/config';
import { getExternalExercises } from '@/lib/exercises/externalExercises';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured. Get a free key at https://aistudio.google.com/apikey' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const messages = body.messages || [];

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch exercise summaries for context (cached 10 min)
    const allExercises = await getExternalExercises();

    // Build a compact exercise index
    const exerciseSummaries = allExercises
      .slice(0, 400)
      .map(
        (e: any) =>
          `- ${e.name} (${e.category}, ${e.level || 'unspecified'}, equipment: ${e.equipment || 'bodyweight'}, muscles: ${(e.primaryMuscles || []).join(', ')})`
      )
      .join('\n');

    const systemPrompt = `${SYSTEM_PROMPT}\n\nHere is a summary of exercises available in the LiftFlow library:\n${exerciseSummaries}`;

    const google = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY });

    const result = streamText({
      model: google(GEMINI_MODEL),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxOutputTokens: 500,
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
