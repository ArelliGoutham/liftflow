import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storeAuthCode } from '@/lib/mcp/authCodeStore';
import { getOAuthBaseUrl } from '@/lib/mcp/oauthUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * OAuth 2.0 Authorization endpoint.
 * GET checks for an existing NextAuth session. If signed in, issues an
 * authorization code and redirects to the client's redirect_uri. If not
 * signed in, redirects to /login with a callbackUrl preserving all query
 * params so the user returns here after authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const responseType = params.get('response_type');
    const clientId = params.get('client_id');
    const redirectUri = params.get('redirect_uri');
    const codeChallenge = params.get('code_challenge');
    const codeChallengeMethod = params.get('code_challenge_method') || 'S256';
    const state = params.get('state');
    const scope = params.get('scope') || 'tools';

    if (!responseType || !clientId || !redirectUri || !codeChallenge) {
      return new NextResponse(
        JSON.stringify({ error: 'invalid_request', error_description: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (responseType !== 'code') {
      return new NextResponse(
        JSON.stringify({ error: 'unsupported_response_type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Not signed in — redirect to login, preserving callback
      const baseUrl = getOAuthBaseUrl();
      const authorizeUrl = `${baseUrl}/api/mcp/auth/authorize?${params.toString()}`;
      const loginUrl = new URL('/login', baseUrl);
      loginUrl.searchParams.set('callbackUrl', authorizeUrl);
      return NextResponse.redirect(loginUrl);
    }

    // User is signed in — issue authorization code
    const code = storeAuthCode(
      session.user.id,
      clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      scope
    );

    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('[OAuth authorize] error:', err);
    return new NextResponse(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
