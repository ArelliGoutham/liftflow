import { getOAuthBaseUrl } from '@/lib/mcp/oauthUtils';

export const runtime = 'nodejs';

/**
 * Returns OAuth 2.0 Authorization Server Metadata (RFC 8414).
 * MCP clients use this to discover authorize, token, register, and revoke endpoints.
 */
export async function GET() {
  const baseUrl = getOAuthBaseUrl();

  return new Response(
    JSON.stringify({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/api/mcp/auth/authorize`,
      token_endpoint: `${baseUrl}/api/mcp/auth/token`,
      registration_endpoint: `${baseUrl}/api/mcp/auth/register`,
      revocation_endpoint: `${baseUrl}/api/mcp/auth/revoke`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      token_endpoint_auth_methods_supported: ['none'],
      code_challenge_methods_supported: ['S256'],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
