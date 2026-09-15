import { NextRequest } from 'next/server';
import { revokeToken } from '@/lib/db/repositories/oauthTokenRepository';

export const runtime = 'nodejs';

/**
 * OAuth 2.0 Token Revocation endpoint (RFC 7009).
 * POST revokes an access token. Always returns 200 per RFC (even if token not found).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return new Response(
        JSON.stringify({ error: 'invalid_request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = formData.get('token');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'invalid_request', error_description: 'Missing token parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await revokeToken(token as string);

    // RFC 7009: always return 200, even if token not found
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error('[OAuth revoke] error:', err);
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
