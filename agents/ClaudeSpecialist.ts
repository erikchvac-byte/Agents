/**
 * Claude-Specialist (Agent 3) - VS Code Only
 * Deep reasoning for complex tasks using Task tool
 *
 * EXECUTION:
 * - Uses Task tool to spawn claude-specialist sub-agents
 * - Runs exclusively in Claude Code / VS Code environment
 * - NO API calls, NO simulation, NO fallbacks
 * - Real execution only
 */

import { StateManager } from '../state/StateManager';
import { Logger } from './Logger';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration_ms: number;
}

export class ClaudeSpecialist {
  private logger: Logger;

  constructor(_stateManager: StateManager, logger: Logger) {
    this.logger = logger;

    // Verify Task tool is available
    if (typeof (globalThis as any).Task !== 'function') {
      console.warn(
        '[ClaudeSpecialist] WARNING: Task tool not available. ClaudeSpecialist requires VS Code/Claude Code environment.'
      );
    } else {
      console.log('[ClaudeSpecialist] Initialized with Task tool');
    }
  }

  /**
   * Execute a complex task using Task tool
   * @param task Task description
   * @returns Execution result
   */
  async execute(task: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Get Task function from global scope
      const TaskFn = (globalThis as any).Task;

      if (typeof TaskFn !== 'function') {
        throw new Error(
          'Task tool not available. ClaudeSpecialist requires Claude Code / VS Code environment.'
        );
      }

      // Spawn a claude-specialist sub-agent for code generation
      const result = await TaskFn({
        subagent_type: 'claude-specialist',
        prompt: `Generate production-ready TypeScript code for the following task:

${task}

Requirements:
- Use TypeScript strict mode
- Include comprehensive error handling
- Follow security best practices (input validation, sanitization)
- Add clear documentation with JSDoc comments
- Implement proper type safety
- Use modern TypeScript features (async/await, destructuring, etc.)
- Include input validation where appropriate
- Handle edge cases

Return ONLY the code implementation with comments. Do not include explanations outside the code.`,
        description: 'Generate code for complex task',
        model: 'sonnet', // Use Sonnet for deep reasoning
      });

      const output = result.output || result.toString();

      return {
        success: true,
        output,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

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
}
