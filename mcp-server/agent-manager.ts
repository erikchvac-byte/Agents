/**
 * Agent Manager - Singleton for managing all 19 agents
 * Handles initialization, state management, and execution routing
 */

import { StateManager } from '../state/StateManager.js';
import { Logger } from '../agents/Logger.js';
import { SessionManager } from '../agents/SessionManager.js';
import { Router } from '../agents/Router.js';
import { MetaCoordinator } from '../agents/MetaCoordinator.js';
import { OllamaSpecialist } from '../agents/OllamaSpecialist.js';
import { ClaudeSpecialist } from '../agents/ClaudeSpecialist.js';
import { Critic } from '../agents/Critic.js';
import { Architect } from '../agents/Architect.js';
import { RepairAgent } from '../agents/RepairAgent.js';
import { AutoDebug } from '../agents/AutoDebug.js';
import { LogicArchivist } from '../agents/LogicArchivist.js';
import { DependencyScout } from '../agents/DependencyScout.js';
import { DataExtractor } from '../agents/DataExtractor.js';
import { PerformanceMonitor } from '../agents/PerformanceMonitor.js';
import { RoutingOptimizer } from '../agents/RoutingOptimizer.js';
import { Watcher } from '../agents/Watcher.js';

import * as path from 'path';

export class AgentManager {
  private static instance: AgentManager | null = null;
  
  // Infrastructure
  private stateManager!: StateManager;
  private logger!: Logger;
  private sessionManager!: SessionManager;
  
  // Core agents
  private router!: Router;
  private metaCoordinator!: MetaCoordinator;
  private ollamaSpecialist!: OllamaSpecialist;
  private claudeSpecialist!: ClaudeSpecialist;
  
  // Quality agents
  private critic!: Critic;
  private architect!: Architect;
  private repairAgent!: RepairAgent;
  
  // Support agents
  private autoDebug!: AutoDebug;
  private logicArchivist!: LogicArchivist;
  private dependencyScout!: DependencyScout;
  private dataExtractor!: DataExtractor;
  private performanceMonitor!: PerformanceMonitor;
  private routingOptimizer!: RoutingOptimizer;
  private watcher!: Watcher;
  
  private workingDir: string;
  private initialized: boolean = false;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  /**
   * Get singleton instance
   */
  static getInstance(workingDir?: string): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager(workingDir);
    }
    return AgentManager.instance;
  }

  /**
   * Initialize all agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.error('[AgentManager] Initializing infrastructure...');
    
    // Initialize infrastructure
    this.stateManager = new StateManager(
      path.join(this.workingDir, 'state', 'session_state.json')
    );
    await this.stateManager.initialize();
    
    this.logger = new Logger(path.join(this.workingDir, 'logs'));
    
    this.sessionManager = new SessionManager(
      path.join(this.workingDir, 'state', 'session_summary.json'),
      this.stateManager
    );

    console.error('[AgentManager] Initializing core agents...');
    
    // Initialize core agents
    this.router = new Router(this.stateManager, this.logger);
    this.metaCoordinator = new MetaCoordinator(this.stateManager, this.logger);
    this.ollamaSpecialist = new OllamaSpecialist(
      this.stateManager,
      this.logger,
      true, // useMCP
      this.workingDir
    );
    this.claudeSpecialist = new ClaudeSpecialist(
      this.stateManager,
      this.logger,
      this.workingDir
    );

    console.error('[AgentManager] Initializing quality agents...');
    
    // Initialize quality agents
    this.critic = new Critic(this.stateManager);
    this.architect = new Architect(this.workingDir, this.stateManager);
    this.repairAgent = new RepairAgent(this.stateManager, this.logger, this.workingDir);

    console.error('[AgentManager] Initializing support agents...');
    
    // Initialize support agents
    this.autoDebug = new AutoDebug(this.stateManager, this.logger, this.workingDir);
    this.logicArchivist = new LogicArchivist();
    this.dependencyScout = new DependencyScout(this.workingDir, this.stateManager);
    this.dataExtractor = new DataExtractor(this.stateManager, this.logger, this.workingDir);
    this.performanceMonitor = new PerformanceMonitor(this.stateManager, this.logger, this.workingDir);
    this.routingOptimizer = new RoutingOptimizer(this.stateManager, this.logger, this.workingDir);
    this.watcher = new Watcher(this.workingDir, this.stateManager);

    this.initialized = true;
    console.error('[AgentManager] All agents initialized successfully');
  }

  /**
   * Execute a tool (route to appropriate agent)
   */
  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.error(`[AgentManager] Executing tool: ${toolName}`);

    switch (toolName) {
      // Router
      case 'analyze_task_complexity':
        return await this.router.analyzeComplexity(args.task as string);

      // MetaCoordinator
      case 'route_task':
        return await this.metaCoordinator.route(
          args.task as string,
          args.complexity as any,
          args.forceAgent as any
        );

      // OllamaSpecialist
      case 'execute_simple_task':
        return await this.ollamaSpecialist.execute(args.task as string);

      // ClaudeSpecialist
      case 'execute_complex_task':
        return await this.claudeSpecialist.execute(args.task as string);

      // Critic
      case 'review_code':
        return await this.critic.reviewCode(
          args.diffs as any[],
          args.requirements as string
        );

      // Architect
      case 'analyze_architecture':
        return await this.architect.analyzeProject();

      case 'get_architectural_guidance':
        return await this.architect.recommendFileStructure(
          args.featureName as string,
          args.featureType as string
        );

      // RepairAgent
      case 'repair_code':
        return await this.repairAgent.repair(
          args.review as any,
          args.originalCode as string,
          args.filePath as string
        );

      // AutoDebug
      case 'analyze_error':
        return await this.autoDebug.analyzeFailure(args.error as any);

      // LogicArchivist
      case 'document_code':
        return await this.logicArchivist.documentCode(
          args.code as string,
          args.filePath as string,
          args.language as string,
          {
            taskComplexity: args.taskComplexity as number,
            codeComplexity: args.codeComplexity as number,
          }
        );

      // DependencyScout
      case 'analyze_dependencies':
        return await this.dependencyScout.scanDependencies();

      // DataExtractor
      case 'extract_data':
        return await this.dataExtractor.extractContext(
          args.targetDir as string || '.',
          args.recursive as boolean || true
        );

      // PerformanceMonitor
      case 'get_performance_metrics':
        return await this.performanceMonitor.generateReport(
          args.lookbackMinutes as number || 60
        );

      // RoutingOptimizer
      case 'optimize_routing':
        return await this.routingOptimizer.analyzeAndOptimize();

      // SessionManager
      case 'start_session':
        return await this.sessionManager.initialize();

      case 'end_session':
        return await this.sessionManager.finalize(args.summary as any);

      // Logger
      case 'get_recent_logs':
        return await this.logger.queryLogs({
          agent: args.agent as string,
          start_date: args.start_date as string,
          end_date: args.end_date as string,
          error_type: args.error_type as string,
        });

      // WP3 Test stub - will be removed in WP4
      case 'ping':
        return { status: 'ok', timestamp: Date.now(), message: 'MCP server is alive' };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.error('[AgentManager] Cleaning up resources...');
    // Add any cleanup logic here (close file handles, etc.)
    this.initialized = false;
    AgentManager.instance = null;
  }
}