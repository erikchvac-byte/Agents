#!/usr/bin/env node

/**
 * MCP Server Entry Point
 * Exposes 19 agents from multi-agent system as MCP tools
 * Transport: stdio (for OpenCode and other MCP clients)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { AgentManager } from './agent-manager.js';
import { AGENT_TOOLS } from './tools.js';

/**
 * Main MCP Server Class
 */
class AgentMCPServer {
  private server: Server;
  private agentManager: AgentManager;

  constructor() {
    this.server = new Server(
      {
        name: 'multi-agent-dev-system',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.agentManager = new AgentManager();
    this.setupHandlers();
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // List available tools (agent actions)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: AGENT_TOOLS,
    }));

    // Handle tool calls (agent executions)
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.agentManager.executeTool(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources (logs, state files)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [], // Will be implemented in WP8
    }));

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      throw new Error('Resources not yet implemented'); // Will be implemented in WP8
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log to stderr (stdout is reserved for MCP protocol)
    console.error('Multi-Agent MCP Server running on stdio');
    console.error('Available agents: 19');
    console.error('Protocol: Model Context Protocol v1.0');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.agentManager.cleanup();
    await this.server.close();
    console.error('MCP Server shutdown complete');
  }
}

/**
   * Main execution
   */
async function main() {
  const server = new AgentMCPServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down...');
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down...');
    await server.shutdown();
    process.exit(0);
  });

  // Start server
  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
