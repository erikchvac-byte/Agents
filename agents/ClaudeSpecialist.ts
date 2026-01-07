/**
 * Claude-Specialist (Agent 3) - Production Version
 * Deep reasoning for complex tasks
 *
 * IMPLEMENTATION:
 * - Executes complex code generation tasks
 * - Uses Claude API for deep reasoning
 * - Returns generated code with architectural insights
 */

import { StateManager } from '../state/StateManager';
import { Logger } from './Logger';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration_ms: number;
  reasoning?: string; // Claude can provide reasoning for complex decisions
}

export class ClaudeSpecialist {
  private stateManager: StateManager;
  private logger: Logger;
  private apiKey: string;
  private model: string = 'claude-sonnet-4-5'; // Latest Claude model
  private useSimulation: boolean = false;

  constructor(stateManager: StateManager, logger: Logger, useSimulation: boolean = false) {
    this.stateManager = stateManager;
    this.logger = logger;
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.useSimulation = useSimulation;

    if (!this.apiKey && !useSimulation) {
      console.warn(
        'Claude API key not found. Will use simulation mode for testing.'
      );
      this.useSimulation = true;
    }
  }

  /**
   * Check if Claude API is available
   */
  async checkAvailability(): Promise<boolean> {
    return this.useSimulation || !!this.apiKey;
  }

  /**
   * Execute a complex task using Claude API
   * @param task Task description
   * @returns Execution result
   */
  async execute(task: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Check availability
      const available = await this.checkAvailability();
      if (!available) {
        throw new Error('Claude API not available');
      }

      // Execute with Claude (or simulation)
      const output = this.useSimulation
        ? await this.simulateClaudeExecution(task)
        : await this.executeWithClaude(task);

      const result: ExecutionResult = {
        success: true,
        output,
        duration_ms: Date.now() - startTime,
      };

      // Update state
      const state = await this.stateManager.readState();
      state.assigned_agent = 'claude-specialist';
      await this.stateManager.writeState(state);

      // Log the execution
      await this.logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'claude-specialist',
        action: 'execute_task',
        input: { task },
        output: result,
        duration_ms: result.duration_ms,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.logger.logFailure({
        timestamp: new Date().toISOString(),
        agent: 'claude-specialist',
        error: errorMessage,
        task,
        retry_count: 0,
      });

      return {
        success: false,
        output: '',
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute task with Claude API
   */
  private async executeWithClaude(task: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert software architect and code generation assistant. Generate clean, well-architected TypeScript code.

Focus on:
- Type safety (TypeScript strict mode)
- Clear function signatures
- Best practices and design patterns
- Security considerations
- Performance optimization
- Comprehensive error handling
- Clear documentation

For complex tasks:
1. Analyze the architectural implications
2. Consider edge cases and error scenarios
3. Implement with scalability in mind
4. Include helpful comments for complex logic

Return ONLY the code, no explanations unless the task specifically asks for them.`;

      // Call Claude API via fetch
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.3, // Lower temperature for more deterministic code
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: task,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Claude API error (${response.status}): ${errorText}`
        );
      }

      const data: unknown = await response.json();

      // Extract text from Claude's response
      // Type guard for Claude API response
      if (
        data &&
        typeof data === 'object' &&
        'content' in data &&
        Array.isArray(data.content) &&
        data.content.length > 0 &&
        typeof data.content[0] === 'object' &&
        data.content[0] !== null &&
        'text' in data.content[0] &&
        typeof data.content[0].text === 'string'
      ) {
        return data.content[0].text;
      }

      throw new Error('Unexpected API response format');
    } catch (error) {
      throw new Error(
        `Claude API execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Simulate Claude execution (Fallback for testing)
   * Used when API key is unavailable
   */
  private async simulateClaudeExecution(task: string): Promise<string> {
    // Simulate complex reasoning for testing
    const taskLower = task.toLowerCase();

    if (taskLower.includes('refactor') && taskLower.includes('auth')) {
      return `/**
 * OAuth Authentication Architecture
 * Refactored for security and scalability
 */

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

class OAuthAuthenticator {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  async authenticate(code: string): Promise<AuthUser> {
    // Exchange authorization code for access token
    const accessToken = await this.exchangeCodeForToken(code);

    // Fetch user info
    const userInfo = await this.fetchUserInfo(accessToken);

    return userInfo;
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    // Implementation would call OAuth provider
    throw new Error('Not implemented - integration required');
  }

  private async fetchUserInfo(token: string): Promise<AuthUser> {
    // Implementation would call OAuth provider
    throw new Error('Not implemented - integration required');
  }
}

export { OAuthAuthenticator, type OAuthConfig, type AuthUser };`;
    }

    // Default complex response
    return `/**
 * Generated solution for: ${task}
 *
 * Architecture considerations:
 * - Type safety with strict mode
 * - Error handling
 * - Scalability
 */

interface TaskConfig {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

class ComplexTaskHandler {
  async execute(config: TaskConfig): Promise<void> {
    try {
      console.log(\`Executing: \${config.name}\`);

      // Implementation logic here
      await this.processTask(config);

      console.log('Task completed successfully');
    } catch (error) {
      console.error('Task failed:', error);
      throw error;
    }
  }

  private async processTask(config: TaskConfig): Promise<void> {
    // Core logic implementation
    // This would be customized based on specific requirements
  }
}

export { ComplexTaskHandler, type TaskConfig };`;
  }
}
