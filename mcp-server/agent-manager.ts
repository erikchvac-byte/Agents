import { StateManager } from '../state/StateManager';
import { SessionState, AgentStatus } from '../state/schemas';
import { AgentRequest, AgentResponse } from './types';
import { Router } from '../agents/Router';
import { Logger } from '../agents/Logger';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export class AgentManager {
  private stateManager: StateManager;
  private logger: Logger;
  private router: Router;
  private activeAgents: Map<string, any> = new Map();

  constructor(stateManager: StateManager, logDir: string = 'logs') {
    this.stateManager = stateManager;
    this.logger = new Logger(logDir);
    this.router = new Router(stateManager, this.logger);
    this.initializeAgents();
  }

  private initializeAgents(): void {
    this.activeAgents.set('router', this.router);
    this.activeAgents.set('logger', this.logger);
  }

  async executeTask(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const taskId = uuidv4();

    try {
      const analysis = await this.router.analyzeComplexity(request.task);
      
      const state = await this.stateManager.getState();
      const agent = state.assigned_agent || 'router';

      await this.stateManager.updateField('assigned_agent', agent);

      return {
        success: true,
        result: {
          analysis,
          taskId,
        },
        agent,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration_ms: Date.now() - startTime,
      };
    }
  }

  async getAgentStatus(agentName: string): Promise<AgentStatus | null> {
    try {
      const state = await this.stateManager.getState();
      return state.agent_status[agentName] || null;
    } catch (error) {
      return null;
    }
  }

  async listAgents(): Promise<string[]> {
    return Array.from(this.activeAgents.keys());
  }

  async getCurrentState(): Promise<Partial<SessionState>> {
    try {
      const state = await this.stateManager.getState();
      return {
        current_task: state.current_task,
        assigned_agent: state.assigned_agent,
        complexity: state.complexity,
        last_updated: state.last_updated,
      };
    } catch (error) {
      throw new Error(`Failed to get state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async resetState(): Promise<void> {
    try {
      const defaultState = {
        current_task: null,
        assigned_agent: null,
        complexity: null,
        architectural_design: {},
        dependency_report: {},
        review_verdict: null,
        repair_attempts: 0,
        generated_files: [],
        last_updated: new Date().toISOString(),
        agent_status: {},
      };

      await this.stateManager.writeState(defaultState as any);
    } catch (error) {
      throw new Error(`Failed to reset state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
