import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { allTools } from '@/lib/ai/tools';
import type { ToolContext } from '@/lib/ai/tools/types';
import { validateToken } from '@/lib/db/repositories/oauthTokenRepository';
import { getOAuthBaseUrl } from '@/lib/mcp/oauthUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns a 401 response with the WWW-Authenticate header pointing to the
 * OAuth 2.0 Protected Resource Metadata endpoint, as required by MCP spec.
 * @param message - Optional error message for the response body
 * @returns 401 Response with WWW-Authenticate header
 */
function unauthorizedResponse(message: string): Response {
  const baseUrl = getOAuthBaseUrl();
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
      },
    }
  );
}

/**
 * MCP Server endpoint using Streamable HTTP transport.
 * Supports two auth modes:
 * 1. OAuth 2.0 Bearer token (for MCP clients — Copilot, VS Code, etc.)
 * 2. NextAuth session (for web-app browser usage)
 *
 * If not authenticated, returns 401 with WWW-Authenticate header to trigger OAuth flow.
 */
export async function POST(request: NextRequest) {
  try {
    let userId: string | undefined;
    let email: string | undefined;
    let name: string | undefined;

    // Check for OAuth Bearer token first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const tokenUserId = await validateToken(token);
      if (tokenUserId) {
        userId = tokenUserId;
      } else {
        return unauthorizedResponse('Invalid or expired token');
      }
    } else {
      // Fall back to NextAuth session for browser-based usage
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return unauthorizedResponse('Unauthorized — sign in at /login or provide a Bearer token to use LiftFlow MCP');
      }
      userId = session.user.id;
      email = session.user.email || undefined;
      name = session.user.name || undefined;
    }

    const context: ToolContext = {
      userId,
      email,
      name,
    };

    // Handle MCP JSON-RPC request
    const body = await request.json();
    
    // Process the MCP request
    const { id, method, params } = body;

    // Tool listing
    if (method === 'tools/list') {
      // Get the tool list from the server
      const tools = allTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: {
          type: 'object' as const,
          properties: Object.fromEntries(
            Object.entries((t.parameters as any).shape).map(([key, schema]: [string, any]) => [
              key,
              schema._def?.typeName === 'ZodOptional'
                ? { type: getZodType(schema._def.innerType) }
                : { type: getZodType(schema) },
            ])
          ),
          required: Object.entries((t.parameters as any).shape)
            .filter(([_, schema]: [string, any]) => schema._def?.typeName !== 'ZodOptional' && !schema.isOptional?.())
            .map(([key]) => key),
        },
      }));

      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id, result: { tools } }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Tool call
    if (method === 'tools/call') {
      const { name: toolName, arguments: toolArgs } = params || {};

      const tool = allTools.find((t) => t.name === toolName);
      if (!tool) {
        return new Response(
          JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown tool: ${toolName}` } }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Convert snake_case to camelCase for tool params
        const normalizedArgs = toCamelCase(toolArgs || {});
        console.log(`[MCP tool: ${toolName}] Params:`, JSON.stringify(normalizedArgs));
        
        const result = await tool.execute(normalizedArgs, context);
        console.log(`[MCP tool: ${toolName}] Result:`, JSON.stringify(result).slice(0, 200));

        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(result) }],
            },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        console.error(`[MCP tool: ${toolName}] Error:`, err);
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify({ error: `Tool failed: ${err instanceof Error ? err.message : 'unknown'}` }) }],
              isError: true,
            },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Initialize
    if (method === 'initialize') {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'liftflow',
              version: '1.0.0',
            },
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ping
    if (method === 'ping') {
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id, result: {} }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Unknown method
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown method: ${method}` } }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[MCP] Error:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: 'MCP server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET endpoint for MCP discovery / health check
export async function GET() {
  return new Response(
    JSON.stringify({
      server: 'liftflow',
      version: '1.0.0',
      protocolVersion: '2025-06-18',
      tools: allTools.map((t) => t.name),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// Helper: get JSON schema type from Zod schema
function getZodType(schema: any): string {
  const typeName = schema?._def?.typeName;
  if (typeName === 'ZodString') return 'string';
  if (typeName === 'ZodNumber') return 'number';
  if (typeName === 'ZodBoolean') return 'boolean';
  if (typeName === 'ZodArray') return 'array';
  if (typeName === 'ZodEnum') return 'string';
  if (typeName === 'ZodOptional') return getZodType(schema._def.innerType);
  return 'string';
}

// Helper: convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result;
}
