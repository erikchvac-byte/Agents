import { AgentManager } from './agent-manager';
import { MCPTool, AgentRequest } from './types';

export function createTools(agentManager: AgentManager): Map<string, MCPTool> {
  const tools = new Map<string, MCPTool>();

  tools.set('execute_task', {
    name: 'execute_task',
    description: 'Execute a development task through the multi-agent system',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Task description to execute',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Task priority level',
        },
      },
      required: ['task'],
    },
  });

  tools.set('get_agent_status', {
    name: 'get_agent_status',
    description: 'Get the current status of a specific agent',
    inputSchema: {
      type: 'object',
      properties: {
        agent_name: {
          type: 'string',
          description: 'Name of the agent to query',
        },
      },
      required: ['agent_name'],
    },
  });

  tools.set('list_agents', {
    name: 'list_agents',
    description: 'List all available agents in the system',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  });

  tools.set('get_system_state', {
    name: 'get_system_state',
    description: 'Get the current system state',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  });

  tools.set('reset_state', {
    name: 'reset_state',
    description: 'Reset the system state to defaults',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  });

  return tools;
}

export async function handleToolCall(
  toolName: string,
  args: any,
  agentManager: AgentManager
): Promise<any> {
  try {
    let resultText: string;

    switch (toolName) {
      case 'execute_task': {
        const request: AgentRequest = {
          task: args.task,
          priority: args.priority || 'medium',
        };

        const result = await agentManager.executeTask(request);
        resultText = JSON.stringify(result, null, 2);
        break;
      }

      case 'get_agent_status': {
        const status = await agentManager.getAgentStatus(args.agent_name);
        resultText = JSON.stringify({ agent: args.agent_name, status }, null, 2);
        break;
      }

      case 'list_agents': {
        const agents = await agentManager.listAgents();
        resultText = JSON.stringify({ agents }, null, 2);
        break;
      }

      case 'get_system_state': {
        const state = await agentManager.getCurrentState();
        resultText = JSON.stringify(state, null, 2);
        break;
      }

      case 'reset_state': {
        await agentManager.resetState();
        resultText = JSON.stringify({ success: true, message: 'State reset successfully' }, null, 2);
        break;
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error),
              tool: toolName,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}
