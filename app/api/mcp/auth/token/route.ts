import { NextRequest } from 'next/server';
import { consumeAuthCode } from '@/lib/db/repositories/authCodeRepository';
import { verifyPkce, TOKEN_TTL_SECONDS } from '@/lib/mcp/oauthUtils';
import {
  createToken,
  refreshAccessToken,
} from '@/lib/db/repositories/oauthTokenRepository';
import { getOAuthClient } from '@/lib/db/repositories/oauthClientRepository';

export const runtime = 'nodejs';

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

    if (grantType === 'refresh_token') {
      return handleRefreshTokenGrant(formData);
    }

    if (grantType !== 'authorization_code') {
      return new Response(
        JSON.stringify({ error: 'unsupported_grant_type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handleAuthorizationCodeGrant(formData);
  } catch (err) {
    console.error('[OAuth token] error:', err);
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handles the authorization_code grant type — exchanges an auth code for access + refresh tokens.
 * @param formData - The parsed form data from the token request
 * @returns JSON response with token pair or OAuth error
 */
async function handleAuthorizationCodeGrant(formData: FormData): Promise<Response> {
  const code = formData.get('code');
  const redirectUri = formData.get('redirect_uri');
  const clientId = formData.get('client_id');
  const codeVerifier = formData.get('code_verifier');

  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return new Response(
      JSON.stringify({ error: 'invalid_request', error_description: 'Missing required parameters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const client = await getOAuthClient(clientId as string);
  if (!client) {
    return new Response(
      JSON.stringify({ error: 'invalid_client' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const authCode = await consumeAuthCode(code as string);
  if (!authCode) {
    return new Response(
      JSON.stringify({ error: 'invalid_grant', error_description: 'Authorization code is invalid or expired' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (authCode.clientId !== clientId || authCode.redirectUri !== redirectUri) {
    return new Response(
      JSON.stringify({ error: 'invalid_grant', error_description: 'Client or redirect mismatch' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!verifyPkce(codeVerifier as string, authCode.codeChallenge)) {
    return new Response(
      JSON.stringify({ error: 'invalid_grant', error_description: 'PKCE verification failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { accessToken, refreshToken } = await createToken(
    authCode.userId.toString(),
    authCode.clientId,
    'tools'
  );

  return new Response(
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: TOKEN_TTL_SECONDS,
      scope: 'tools',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handles the refresh_token grant type — issues a new access token from a valid refresh token.
 * @param formData - The parsed form data from the token request
 * @returns JSON response with new token pair or OAuth error
 */
async function handleRefreshTokenGrant(formData: FormData): Promise<Response> {
  const refreshToken = formData.get('refresh_token');
  const clientId = formData.get('client_id');

  if (!refreshToken || !clientId) {
    return new Response(
      JSON.stringify({ error: 'invalid_request', error_description: 'Missing required parameters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const client = await getOAuthClient(clientId as string);
  if (!client) {
    return new Response(
      JSON.stringify({ error: 'invalid_client' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = await refreshAccessToken(refreshToken as string);
  if (!result) {
    return new Response(
      JSON.stringify({ error: 'invalid_grant', error_description: 'Refresh token is invalid or expired' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      token_type: 'bearer',
      expires_in: TOKEN_TTL_SECONDS,
      scope: result.scope,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
