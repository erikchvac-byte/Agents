/**
 * MVP Pipeline - End-to-End Task Execution
 *
 * Flow: User Task → Router → Meta-Coordinator → Ollama → Logger
 *
 * This is the minimal viable system that proves the concept works.
 */

import { StateManager } from './state/StateManager';
import { Logger } from './agents/Logger';
import { SessionManager } from './agents/SessionManager';
import { Router } from './agents/Router';
import { MetaCoordinator } from './agents/MetaCoordinator';
import { OllamaSpecialist } from './agents/OllamaSpecialist';
import * as path from 'path';

export interface PipelineResult {
  success: boolean;
  task: string;
  complexity: string;
  assignedAgent: string;
  output: string;
  error?: string;
  totalDuration: number;
}

export class Pipeline {
  private stateManager: StateManager;
  private logger: Logger;
  private sessionManager: SessionManager;
  private router: Router;
  private metaCoordinator: MetaCoordinator;
  private ollamaSpecialist: OllamaSpecialist;

  constructor(workingDir: string = process.cwd()) {
    // Initialize infrastructure
    this.stateManager = new StateManager(
      path.join(workingDir, 'state', 'session_state.json')
    );
    this.logger = new Logger(path.join(workingDir, 'logs'));
    this.sessionManager = new SessionManager(
      path.join(workingDir, 'state', 'session_summary.json'),
      this.stateManager
    );

    // Initialize agents
    this.router = new Router(this.stateManager, this.logger);
    this.metaCoordinator = new MetaCoordinator(this.stateManager, this.logger);
    this.ollamaSpecialist = new OllamaSpecialist(this.stateManager, this.logger);
  }

  /**
   * Execute a task through the complete pipeline
   * @param task Task description
   * @returns Pipeline result
   */
  async executeTask(task: string): Promise<PipelineResult> {
    const startTime = Date.now();

    try {
      // Step 1: Start session
      const session = await this.sessionManager.initialize();
      console.log(`[Pipeline] Session started: ${session.session_id}`);

      // Step 2: Router analyzes complexity
      console.log(`[Pipeline] Routing task: "${task}"`);
      const complexityAnalysis = await this.router.analyzeComplexity(task);
      console.log(
        `[Pipeline] Complexity: ${complexityAnalysis.complexity} (score: ${complexityAnalysis.score})`
      );

      // Step 3: Meta-Coordinator routes to execution agent
      const routingDecision = await this.metaCoordinator.route(
        task,
        complexityAnalysis.complexity
      );
      console.log(
        `[Pipeline] Routed to: ${routingDecision.targetAgent} (${routingDecision.reason})`
      );

      // Step 4: Execute with appropriate agent
      let executionResult;

      if (routingDecision.targetAgent === 'ollama-specialist') {
        executionResult = await this.ollamaSpecialist.execute(task);
      } else {
        // For MVP, we only have Ollama implemented
        // Claude would be added here in future
        console.log(
          '[Pipeline] Claude not implemented yet, falling back to Ollama'
        );
        executionResult = await this.ollamaSpecialist.execute(task);
      }

      // Step 5: Compile result
      const result: PipelineResult = {
        success: executionResult.success,
        task,
        complexity: complexityAnalysis.complexity,
        assignedAgent: routingDecision.targetAgent,
        output: executionResult.output,
        error: executionResult.error,
        totalDuration: Date.now() - startTime,
      };

      console.log(
        `[Pipeline] Execution ${result.success ? 'succeeded' : 'failed'} in ${result.totalDuration}ms`
      );

      // Step 6: Update session
      if (result.success) {
        await this.sessionManager.addAccomplishment(task);
      } else {
        await this.sessionManager.addIncompleteTask(task);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Pipeline] Error: ${errorMessage}`);

      await this.logger.logFailure({
        timestamp: new Date().toISOString(),
        agent: 'pipeline',
        error: errorMessage,
        task,
        retry_count: 0,
      });

      return {
        success: false,
        task,
        complexity: 'unknown',
        assignedAgent: 'none',
        output: '',
        error: errorMessage,
        totalDuration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get current session state
   */
  async getState() {
    return this.stateManager.getState();
  }
}
