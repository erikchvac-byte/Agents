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
import { ClaudeSpecialist } from './agents/ClaudeSpecialist';
import { Critic } from './agents/Critic';
import { Architect } from './agents/Architect';
import { RepairAgent } from './agents/RepairAgent';
import { promises as fs } from 'fs';
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
  filesWritten?: string[];
  repairAttempts?: number;
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
  private repairAgent: RepairAgent;
  private enableCritic: boolean;
  private enableArchitect: boolean;
  private maxRepairAttempts: number = 3;

  constructor(
    workingDir: string = process.cwd(),
    useMCP: boolean = true,
    enableCritic: boolean = true,
    enableArchitect: boolean = true
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
      useMCP,
      workingDir
    );
    this.claudeSpecialist = new ClaudeSpecialist(
      this.stateManager,
      this.logger,
      workingDir
    );
    this.critic = new Critic(this.stateManager);
    this.architect = new Architect(workingDir, this.stateManager);
    this.repairAgent = new RepairAgent(this.stateManager, this.logger, workingDir);
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

      // If execution failed, return early
      if (!executionResult.success) {
        await this.sessionManager.addIncompleteTask(task);
        return {
          success: false,
          task,
          complexity: complexityAnalysis.complexity,
          assignedAgent: routingDecision.targetAgent,
          output: executionResult.output,
          error: executionResult.error,
          totalDuration: Date.now() - startTime,
        };
      }

      // Step 6: Repair loop with Critic
      let reviewResult;
      let repairAttempts = 0;
      let currentCode = executionResult.output;
      let currentFilePath = executionResult.targetPath || 'generated_code.ts';
      const filesWritten: string[] = [];

      while (repairAttempts <= this.maxRepairAttempts) {
        // Review code with Critic (if enabled)
        if (this.enableCritic) {
          console.log(`[Pipeline] Reviewing code with Critic (attempt ${repairAttempts + 1})...`);

          const codeDiff = [
            {
              file: currentFilePath,
              additions: currentCode.split('\n'),
              deletions: [],
              context: task,
            },
          ];

          reviewResult = await this.critic.reviewCode(codeDiff, task);
          console.log(
            `[Pipeline] Critic verdict: ${reviewResult.verdict} (${reviewResult.issues.length} issues)`
          );

          // Update state with current repair attempt
          await this.stateManager.updateField('repair_attempts', repairAttempts);
          await this.stateManager.updateField('review_verdict', reviewResult.verdict);

          // Handle verdict
          if (reviewResult.verdict === 'approved') {
            // SUCCESS: Record files if they were written
            if (executionResult.generatedFiles && executionResult.generatedFiles.length > 0) {
              for (const file of executionResult.generatedFiles) {
                filesWritten.push(file.path);
              }
            }

            // Update state with written files
            await this.stateManager.updateField('generated_files', filesWritten);

            console.log(`[Pipeline] Code approved. Files written: ${filesWritten.length > 0 ? filesWritten.join(', ') : 'none'}`);
            break;
          } else if (reviewResult.verdict === 'rejected') {
            // FAILURE: Clean up any files that were written
            console.error(`[Pipeline] Code rejected: ${reviewResult.summary}`);
            await this.cleanupFiles(filesWritten);

            await this.sessionManager.addIncompleteTask(task);
            return {
              success: false,
              task,
              complexity: complexityAnalysis.complexity,
              assignedAgent: routingDecision.targetAgent,
              output: currentCode,
              error: `Code rejected by Critic: ${reviewResult.summary}`,
              totalDuration: Date.now() - startTime,
              review: {
                verdict: reviewResult.verdict,
                issues: reviewResult.issues.length,
                summary: reviewResult.summary,
              },
              repairAttempts,
            };
          } else if (reviewResult.verdict === 'needs_repair') {
            // REPAIR: Attempt to fix issues
            if (repairAttempts >= this.maxRepairAttempts) {
              console.error(`[Pipeline] Max repair attempts (${this.maxRepairAttempts}) exceeded`);
              await this.cleanupFiles(filesWritten);

              await this.sessionManager.addIncompleteTask(task);
              return {
                success: false,
                task,
                complexity: complexityAnalysis.complexity,
                assignedAgent: routingDecision.targetAgent,
                output: currentCode,
                error: `Max repair attempts exceeded. Last issues: ${reviewResult.summary}`,
                totalDuration: Date.now() - startTime,
                review: {
                  verdict: reviewResult.verdict,
                  issues: reviewResult.issues.length,
                  summary: reviewResult.summary,
                },
                repairAttempts,
              };
            }

            console.log(`[Pipeline] Attempting repair (attempt ${repairAttempts + 1})...`);

            const repairResult = await this.repairAgent.repair(
              reviewResult,
              currentCode,
              currentFilePath
            );

            if (!repairResult.success) {
              console.error(`[Pipeline] Repair failed: ${repairResult.error}`);
              await this.cleanupFiles(filesWritten);

              await this.sessionManager.addIncompleteTask(task);
              return {
                success: false,
                task,
                complexity: complexityAnalysis.complexity,
                assignedAgent: routingDecision.targetAgent,
                output: currentCode,
                error: `Repair failed: ${repairResult.error}`,
                totalDuration: Date.now() - startTime,
                review: {
                  verdict: reviewResult.verdict,
                  issues: reviewResult.issues.length,
                  summary: reviewResult.summary,
                },
                repairAttempts: repairAttempts + 1,
              };
            }

            // Update code for next iteration
            currentCode = repairResult.fixedCode;
            filesWritten.push(...repairResult.filesModified);

            console.log(`[Pipeline] Repair completed. Changes: ${repairResult.changesMade.join(', ')}`);

            repairAttempts++;
            // Loop back to re-review the repaired code
          }
        } else {
          // Critic disabled, record files if they were written
          if (executionResult.generatedFiles && executionResult.generatedFiles.length > 0) {
            for (const file of executionResult.generatedFiles) {
              filesWritten.push(file.path);
            }
            await this.stateManager.updateField('generated_files', filesWritten);
          }
          break;
        }
      }

      // Step 7: Compile result
      const result: PipelineResult = {
        success: true,
        task,
        complexity: complexityAnalysis.complexity,
        assignedAgent: routingDecision.targetAgent,
        output: currentCode,
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
        filesWritten,
        repairAttempts,
      };

      console.log(
        `[Pipeline] Execution succeeded in ${result.totalDuration}ms (${repairAttempts} repairs)`
      );

      // Step 8: Update session
      await this.sessionManager.addAccomplishment(task);

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
   * Clean up files that were written before rejection
   */
  private async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        console.log(`[Pipeline] Cleaned up file: ${filePath}`);
      } catch (error) {
        console.warn(`[Pipeline] Failed to cleanup file ${filePath}:`, error);
      }
    }
  }

  /**
   * Get current session state
   */
  async getState() {
    return this.stateManager.getState();
  }
}
