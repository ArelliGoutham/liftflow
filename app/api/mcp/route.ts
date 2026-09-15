import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { allTools } from '@/lib/ai/tools';
import type { ToolContext } from '@/lib/ai/tools/types';
import { validateToken } from '@/lib/db/repositories/oauthTokenRepository';
import { getOAuthBaseUrl } from '@/lib/mcp/oauthUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function jsonrpcResponse(id: any, result: any, status: number = 200): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, result }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

function jsonrpcError(id: any, code: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, method, params } = body;

    // Allow initialize and ping without auth
    if (method === 'initialize') {
      return jsonrpcResponse(id, {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'liftflow', version: '1.0.0' },
      });
    }

    if (method === 'ping') {
      return jsonrpcResponse(id, {});
    }

    // For tools/list and tools/call, require auth
    let userId: string | undefined;
    let email: string | undefined;
    let name: string | undefined;

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const tokenUserId = await validateToken(token);
      if (!tokenUserId) {
        return unauthorizedResponse('Invalid or expired token');
      }
      userId = tokenUserId;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return unauthorizedResponse('Authentication required');
      }
      userId = session.user.id;
      email = session.user.email || undefined;
      name = session.user.name || undefined;
    }

    const context: ToolContext = { userId, email, name };

    if (method === 'tools/list') {
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
      return jsonrpcResponse(id, { tools });
    }

    if (method === 'tools/call') {
      const { name: toolName, arguments: toolArgs } = params || {};
      const tool = allTools.find((t) => t.name === toolName);
      if (!tool) {
        return jsonrpcError(id, -32601, `Unknown tool: ${toolName}`);
      }

      try {
        const normalizedArgs = toCamelCase(toolArgs || {});
        console.log(`[MCP tool: ${toolName}] Params:`, JSON.stringify(normalizedArgs));
        const result = await tool.execute(normalizedArgs, context);
        console.log(`[MCP tool: ${toolName}] Result:`, JSON.stringify(result).slice(0, 200));
        return jsonrpcResponse(id, {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        });
      } catch (err) {
        console.error(`[MCP tool: ${toolName}] Error:`, err);
        return jsonrpcResponse(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: `Tool failed: ${err instanceof Error ? err.message : 'unknown'}` }) }],
          isError: true,
        });
      }
    }

    // notifications/initialized — just return 200
    if (method === 'notifications/initialized') {
      return new Response(null, { status: 200 });
    }

    return jsonrpcError(id, -32601, `Unknown method: ${method}`);
  } catch (err) {
    console.error('[MCP] Error:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: 'MCP server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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
