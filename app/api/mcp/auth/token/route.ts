import { NextRequest } from 'next/server';
import { consumeAuthCode } from '@/lib/mcp/authCodeStore';
import { verifyPkce, TOKEN_TTL_SECONDS } from '@/lib/mcp/oauthUtils';
import { createToken } from '@/lib/db/repositories/oauthTokenRepository';

export const runtime = 'nodejs';

/**
 * OAuth 2.0 Token endpoint.
 * POST exchanges an authorization code for an access token.
 * Validates the code, checks PKCE (code_verifier against stored code_challenge),
 * and issues a 24-hour access token stored in the OAuthToken collection.
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

    const grantType = formData.get('grant_type');
    const code = formData.get('code');
    const redirectUri = formData.get('redirect_uri');
    const clientId = formData.get('client_id');
    const codeVerifier = formData.get('code_verifier');

    if (grantType !== 'authorization_code') {
      return new Response(
        JSON.stringify({ error: 'unsupported_grant_type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!code || !redirectUri || !clientId || !codeVerifier) {
      return new Response(
        JSON.stringify({ error: 'invalid_request', error_description: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Consume the auth code (single-use)
    const authCode = consumeAuthCode(code as string);
    if (!authCode) {
      return new Response(
        JSON.stringify({ error: 'invalid_grant', error_description: 'Authorization code is invalid or expired' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate client_id and redirect_uri match
    if (authCode.clientId !== clientId || authCode.redirectUri !== redirectUri) {
      return new Response(
        JSON.stringify({ error: 'invalid_grant', error_description: 'Client or redirect mismatch' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify PKCE
    if (!verifyPkce(codeVerifier as string, authCode.codeChallenge)) {
      return new Response(
        JSON.stringify({ error: 'invalid_grant', error_description: 'PKCE verification failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Issue access token
    const accessToken = await createToken(
      authCode.userId,
      authCode.clientId,
      authCode.scope
    );

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: TOKEN_TTL_SECONDS,
        scope: authCode.scope,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[OAuth token] error:', err);
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
