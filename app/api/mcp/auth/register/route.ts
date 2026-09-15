import { NextRequest } from 'next/server';
import { registerOAuthClient } from '@/lib/db/repositories/oauthClientRepository';

export const runtime = 'nodejs';

/**
 * Dynamic Client Registration endpoint (RFC 7591).
 * POST creates a new public client registration and returns client_id.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const redirectUris: string[] = Array.isArray(body.redirect_uris)
      ? body.redirect_uris
      : body.redirect_uris
        ? [body.redirect_uris]
        : [];

    const client = await registerOAuthClient(redirectUris);

    return new Response(
      JSON.stringify({
        client_id: client.clientId,
        client_secret: null,
        client_id_issued_at: Math.floor(client.issuedAt / 1000),
        token_endpoint_auth_method: 'none',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[OAuth register] error:', err);
    return new Response(
      JSON.stringify({ error: 'client_registration_failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
