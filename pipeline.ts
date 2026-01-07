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
import { ClaudeSpecialist, ExecutionMode } from './agents/ClaudeSpecialist';
import { Critic } from './agents/Critic';
import { Architect } from './agents/Architect';
import * as path from 'path';

export interface PipelineResult {
  success: boolean;
  task: string;
  complexity: string;
  assignedAgent: string;
  output: string;
  error?: string;
  totalDuration: number;
  architecturalGuidance?: {
    projectType: string;
    recommendedPaths: number;
    style: string;
  };
  review?: {
    verdict: string;
    issues: number;
    summary: string;
  };
}

export class Pipeline {
  private stateManager: StateManager;
  private logger: Logger;
  private sessionManager: SessionManager;
  private router: Router;
  private metaCoordinator: MetaCoordinator;
  private ollamaSpecialist: OllamaSpecialist;
  private claudeSpecialist: ClaudeSpecialist;
  private critic: Critic;
  private architect: Architect;
  private enableCritic: boolean;
  private enableArchitect: boolean;

  constructor(
    workingDir: string = process.cwd(),
    useMCP: boolean = true,
    enableCritic: boolean = true,
    enableArchitect: boolean = true,
    claudeMode: ExecutionMode = 'vscode'
  ) {
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
    this.ollamaSpecialist = new OllamaSpecialist(
      this.stateManager,
      this.logger,
      useMCP
    );
    this.claudeSpecialist = new ClaudeSpecialist(
      this.stateManager,
      this.logger,
      !useMCP ? 'simulation' : claudeMode // Use simulation when MCP disabled (for tests)
    );
    this.critic = new Critic(this.stateManager);
    this.architect = new Architect(workingDir, this.stateManager);
    this.enableCritic = enableCritic;
    this.enableArchitect = enableArchitect;
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

      // Step 3: Architect analyzes project structure (if enabled and complex task)
      let architecturalDesign;
      if (this.enableArchitect && complexityAnalysis.complexity === 'complex') {
        console.log('[Pipeline] Analyzing project architecture...');
        architecturalDesign = await this.architect.analyzeProject();
        console.log(
          `[Pipeline] Architecture: ${architecturalDesign.projectType} (${architecturalDesign.architecturalStyle})`
        );
      }

      // Step 4: Meta-Coordinator routes to execution agent
      const routingDecision = await this.metaCoordinator.route(
        task,
        complexityAnalysis.complexity
      );
      console.log(
        `[Pipeline] Routed to: ${routingDecision.targetAgent} (${routingDecision.reason})`
      );

      // Step 5: Execute with appropriate agent
      let executionResult;

      if (routingDecision.targetAgent === 'ollama-specialist') {
        executionResult = await this.ollamaSpecialist.execute(task);
      } else if (routingDecision.targetAgent === 'claude-specialist') {
        executionResult = await this.claudeSpecialist.execute(task);
      } else {
        // Fallback to Ollama for unknown agents
        console.log(
          `[Pipeline] Unknown agent ${routingDecision.targetAgent}, falling back to Ollama`
        );
        executionResult = await this.ollamaSpecialist.execute(task);
      }

      // Step 6: Review code with Critic (if enabled and execution succeeded)
      let reviewResult;
      if (this.enableCritic && executionResult.success) {
        console.log('[Pipeline] Reviewing code with Critic...');
        const codeDiff = [
          {
            file: 'generated_code.ts',
            additions: executionResult.output.split('\n'),
            deletions: [],
            context: task,
          },
        ];
        reviewResult = await this.critic.reviewCode(codeDiff, task);
        console.log(
          `[Pipeline] Critic verdict: ${reviewResult.verdict} (${reviewResult.issues.length} issues)`
        );
      }

      // Step 7: Compile result
      const result: PipelineResult = {
        success: executionResult.success,
        task,
        complexity: complexityAnalysis.complexity,
        assignedAgent: routingDecision.targetAgent,
        output: executionResult.output,
        error: executionResult.error,
        totalDuration: Date.now() - startTime,
        architecturalGuidance: architecturalDesign
          ? {
              projectType: architecturalDesign.projectType,
              recommendedPaths: architecturalDesign.recommendedFileStructure.length,
              style: architecturalDesign.architecturalStyle,
            }
          : undefined,
        review: reviewResult
          ? {
              verdict: reviewResult.verdict,
              issues: reviewResult.issues.length,
              summary: reviewResult.summary,
            }
          : undefined,
      };

      console.log(
        `[Pipeline] Execution ${result.success ? 'succeeded' : 'failed'} in ${result.totalDuration}ms`
      );

      // Step 8: Update session
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
