/**
 * Task-Router (Agent 1) - MVP Version
 * Entry point for all tasks - performs complexity analysis
 *
 * MINIMAL IMPLEMENTATION:
 * - Analyzes task complexity based on keywords
 * - Simple scoring algorithm
 * - No ML optimization yet
 */

import { StateManager } from '../state/StateManager';
import { Logger } from './Logger';
import { TaskComplexity } from '../state/schemas';

export interface ComplexityAnalysis {
  complexity: TaskComplexity;
  score: number; // 0-100
  factors: string[];
}

export class Router {
  private stateManager: StateManager;
  private logger: Logger;

  // Keywords indicating complexity
  private readonly COMPLEX_KEYWORDS = [
    'refactor',
    'architecture',
    'optimize',
    'security',
    'algorithm',
    'design pattern',
    'integration',
    'migration',
    'performance',
    'database',
  ];

  private readonly SIMPLE_KEYWORDS = [
    'add function',
    'fix typo',
    'update comment',
    'rename',
    'log',
    'console',
    'sum',
    'calculate',
    'format',
    'parse',
  ];

  constructor(stateManager: StateManager, logger: Logger) {
    this.stateManager = stateManager;
    this.logger = logger;
  }

  /**
   * Analyze task complexity
   * @param task Task description
   * @returns Complexity analysis
   */
  async analyzeComplexity(task: string): Promise<ComplexityAnalysis> {
    const startTime = Date.now();
    const taskLower = task.toLowerCase();

    try {
      // Score based on keyword matching
      let score = 50; // Base score
      const factors: string[] = [];

      // Check for complex indicators
      for (const keyword of this.COMPLEX_KEYWORDS) {
        if (taskLower.includes(keyword)) {
          score += 10;
          factors.push(`Complex keyword: ${keyword}`);
        }
      }

      // Check for simple indicators
      for (const keyword of this.SIMPLE_KEYWORDS) {
        if (taskLower.includes(keyword)) {
          score -= 10;
          factors.push(`Simple keyword: ${keyword}`);
        }
      }

      // Length factor (longer descriptions often indicate complexity)
      if (task.length > 200) {
        score += 15;
        factors.push('Long description');
      } else if (task.length < 50) {
        score -= 10;
        factors.push('Short description');
      }

      // Clamp score to 0-100
      score = Math.max(0, Math.min(100, score));

      // Determine complexity (threshold at 60)
      const complexity: TaskComplexity = score >= 60 ? 'complex' : 'simple';

      const analysis: ComplexityAnalysis = {
        complexity,
        score,
        factors,
      };

      // Update state
      const state = await this.stateManager.readState();
      state.current_task = task;
      state.complexity = complexity;
      await this.stateManager.writeState(state);

      // Log the analysis
      await this.logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'router',
        action: 'analyze_complexity',
        input: { task },
        output: analysis,
        duration_ms: Date.now() - startTime,
      });

      return analysis;
    } catch (error) {
      await this.logger.logFailure({
        timestamp: new Date().toISOString(),
        agent: 'router',
        error: error instanceof Error ? error.message : String(error),
        task,
        retry_count: 0,
      });
      throw error;
    }
  }
}
