import { getOAuthBaseUrl } from '@/lib/mcp/oauthUtils';

export const runtime = 'nodejs';

/**
 * Returns OAuth 2.0 Protected Resource Metadata (RFC 9728).
 * MCP clients fetch this after receiving a 401 with WWW-Authenticate header.
 */
export async function GET() {
  const baseUrl = getOAuthBaseUrl();

  return new Response(
    JSON.stringify({
      resource: `${baseUrl}/api/mcp`,
      authorization_servers: [baseUrl],
      scopes_supported: ['tools'],
      bearer_methods_supported: ['header'],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
