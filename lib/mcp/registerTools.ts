import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ToolContext } from '@/lib/ai/tools/types';
import { allTools } from '@/lib/ai/tools';

/**
 * Creates an MCP server with all LiftFlow tools registered.
 * @param context - User context with userId from authenticated session
 * @returns Configured McpServer instance with all 12 tools registered
 */
export function createLiftFlowMCPServer(context: ToolContext): McpServer {
  const server = new McpServer({
    name: 'liftflow',
    version: '1.0.0',
  });

  for (const tool of allTools) {
    // Convert our ToolDefinition zod schema to MCP tool registration
    server.tool(
      tool.name,
      tool.description,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tool.parameters as any).shape,
      async (args: Record<string, unknown>) => {
        try {
          console.log(`[MCP tool: ${tool.name}] Params:`, JSON.stringify(args));
          const result = await tool.execute(args, context);
          console.log(`[MCP tool: ${tool.name}] Result:`, JSON.stringify(result).slice(0, 200));
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result) }],
          };
        } catch (err) {
          console.error(`[MCP tool: ${tool.name}] Error:`, err);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: `Tool failed: ${err instanceof Error ? err.message : 'unknown'}` }) }],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}
