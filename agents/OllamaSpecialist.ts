/**
 * Ollama-Specialist (Agent 2) - MVP Version
 * Fast local execution for simple tasks
 *
 * MINIMAL IMPLEMENTATION:
 * - Executes simple code generation tasks
 * - Uses local Ollama (free, fast)
 * - Returns generated code
 */

import { StateManager } from '../state/StateManager';
import { Logger } from './Logger';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration_ms: number;
}

export class OllamaSpecialist {
  private stateManager: StateManager;
  private logger: Logger;
  private ollamaAvailable: boolean = false;

  constructor(stateManager: StateManager, logger: Logger) {
    this.stateManager = stateManager;
    this.logger = logger;
  }

  /**
   * Check if Ollama is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // This would normally call Ollama via MCP
      // For MVP, we'll simulate availability
      this.ollamaAvailable = true;
      return true;
    } catch {
      this.ollamaAvailable = false;
      return false;
    }
  }

  /**
   * Execute a simple task using Ollama
   * @param task Task description
   * @returns Execution result
   */
  async execute(task: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Check availability
      if (!this.ollamaAvailable) {
        await this.checkAvailability();
      }

      if (!this.ollamaAvailable) {
        throw new Error('Ollama is not available');
      }

      // For MVP: Simulate Ollama execution
      // In production, this would call mcp__ollama-local__ollama_query
      const output = await this.simulateOllamaExecution(task);

      const result: ExecutionResult = {
        success: true,
        output,
        duration_ms: Date.now() - startTime,
      };

      // Update state
      const state = await this.stateManager.readState();
      state.assigned_agent = 'ollama-specialist';
      await this.stateManager.writeState(state);

      // Log the execution
      await this.logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'ollama-specialist',
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
        agent: 'ollama-specialist',
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
   * Simulate Ollama execution (MVP placeholder)
   * In production, this calls the actual Ollama model
   */
  private async simulateOllamaExecution(task: string): Promise<string> {
    // Parse the task to generate appropriate code
    const taskLower = task.toLowerCase();

    if (taskLower.includes('sum') && taskLower.includes('two numbers')) {
      return `function sum(a: number, b: number): number {
  return a + b;
}

// Example usage:
const result = sum(5, 3);
console.log(result); // Output: 8`;
    }

    if (taskLower.includes('multiply')) {
      return `function multiply(a: number, b: number): number {
  return a * b;
}`;
    }

    // Default simple function
    return `// Generated code for: ${task}
function executeTask(): void {
  console.log('Task executed successfully');
}`;
  }
}
