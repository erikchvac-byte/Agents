import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AgentManager } from './agent-manager';
import { createTools, handleToolCall } from './tools';
import { StateManager } from '../state/StateManager';
import * as path from 'path';

async function main() {
  const statePath = path.join(process.cwd(), 'logs', 'session_state.json');
  const stateManager = new StateManager(statePath);
  await stateManager.initialize();

  const logDir = path.join(process.cwd(), 'logs');
  const agentManager = new AgentManager(stateManager, logDir);
  const tools = createTools(agentManager);

  const server = new Server(
    {
      name: 'multi-agent-dev-system',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Array.from(tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;

    if (!tools.has(name)) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const result = await handleToolCall(name, args || {}, agentManager);
    return result;
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Multi-Agent Development System MCP Server running');
}

main().catch(error => {
  console.error('Fatal error in MCP server:', error);
  process.exit(1);
});
