export interface MCPServerConfig {
  port?: number;
  host?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export interface AgentRequest {
  task: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AgentResponse {
  success: boolean;
  result?: any;
  error?: string;
  agent?: string;
  duration_ms?: number;
}

export interface StateQuery {
  field?: string;
  agent?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
