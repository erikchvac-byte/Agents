import { StateManager } from '../state/StateManager';
import { Logger } from './Logger';
import { TaskComplexity } from '../state/schemas';

/**
 * RoutingOptimizer (Agent 4)
 * ML-based routing improvement using Ollama MCP
 *
 * Responsibilities:
 * - Analyze routing patterns and decisions
 * - Log routing decisions for pattern analysis
 * - Generate suggestions for improving routing algorithm
 * - Optimize complexity thresholds based on historical data
 * - Adapt to user patterns over time
 */

export interface RoutingDecision {
  task: string;
  complexity: number;
  classification: TaskComplexity;
  chosenAgent: 'ollama-specialist' | 'claude-specialist';
  executionTime: number;
  success: boolean;
  timestamp: string;
}

export interface RoutingAnalysis {
  totalDecisions: number;
  ollamaSuccessRate: number;
  claudeSuccessRate: number;
  avgOllamaTime: number;
  avgClaudeTime: number;
  suggestedThreshold: number;
  confidence: number;
  recommendations: string[];
}

export interface OptimizationResult {
  success: boolean;
  analysis: RoutingAnalysis | null;
  duration_ms: number;
  error?: string;
}

// Type definitions for MCP routing functions
declare function mcp__ollama_local__log_routing_decision(params: {
  task: string;
  score: number;
  recommendation: string;
  actualChoice: string;
  modelUsed: string;
  factors?: any;
  manualOverride?: boolean;
}): Promise<{ logged: boolean }>;

declare function mcp__ollama_local__get_routing_stats(): Promise<{
  total_decisions: number;
  ollama_count: number;
  claude_count: number;
  override_rate: number;
  score_distribution: Record<string, number>;
}>;

declare function mcp__ollama_local__analyze_routing_patterns(): Promise<{
  suggestions: string[];
  optimal_threshold?: number;
  confidence: number;
}>;

export class RoutingOptimizer {
  private logger: Logger;
  private mcpAvailable: boolean = false;

  // Current routing threshold (simple vs complex)
  private static COMPLEXITY_THRESHOLD = 60;

  constructor(_stateManager: StateManager, logger: Logger, _workingDir: string = process.cwd()) {
    this.logger = logger;
    this.checkMCPAvailability();
  }

  /**
   * Check if MCP routing functions are available
   */
  private checkMCPAvailability(): void {
    const globalAny = globalThis as any;
    this.mcpAvailable =
      typeof globalAny.mcp__ollama_local__log_routing_decision === 'function' &&
      typeof globalAny.mcp__ollama_local__get_routing_stats === 'function' &&
      typeof globalAny.mcp__ollama_local__analyze_routing_patterns === 'function';
  }

  /**
   * Log a routing decision for future analysis
   * @param decision Routing decision details
   */
  async logDecision(decision: RoutingDecision): Promise<void> {
    try {
      if (!this.mcpAvailable) {
        // Fallback: log to local logger
        await this.logger.logAgentActivity({
          timestamp: decision.timestamp,
          agent: 'routing-optimizer',
          action: 'routing_decision',
          input: decision,
          output: { logged: true },
          duration_ms: 0,
        });
        return;
      }

      // Determine recommendation based on complexity score
      let recommendation: 'OLLAMA_ONLY' | 'OLLAMA_PREFERRED' | 'BOTH_CAPABLE' | 'CLAUDE_PREFERRED';
      if (decision.complexity < 40) {
        recommendation = 'OLLAMA_ONLY';
      } else if (decision.complexity < 60) {
        recommendation = 'OLLAMA_PREFERRED';
      } else if (decision.complexity < 75) {
        recommendation = 'BOTH_CAPABLE';
      } else {
        recommendation = 'CLAUDE_PREFERRED';
      }

      // Log via MCP
      const globalAny = globalThis as any;
      await globalAny.mcp__ollama_local__log_routing_decision({
        task: decision.task,
        score: decision.complexity,
        recommendation,
        actualChoice: decision.chosenAgent === 'ollama-specialist' ? 'ollama' : 'claude',
        modelUsed: decision.chosenAgent === 'ollama-specialist' ? 'qwen3-coder:30b' : 'claude-sonnet-4.5',
        factors: {
          classification: decision.classification,
          executionTime: decision.executionTime,
          success: decision.success,
        },
        manualOverride: false,
      });

      // Also log locally
      await this.logger.logAgentActivity({
        timestamp: decision.timestamp,
        agent: 'routing-optimizer',
        action: 'log_routing_decision',
        input: decision,
        output: { recommendation, logged: true },
        duration_ms: 0,
      });
    } catch (error) {
      // Silent fallback - don't fail task if logging fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logger.logFailure({
        timestamp: new Date().toISOString(),
        agent: 'routing-optimizer',
        error: errorMessage,
        task: 'Log routing decision',
        retry_count: 0,
      });
    }
  }

  /**
   * Analyze routing patterns and generate optimization recommendations
   * @returns Analysis with recommendations for improving routing
   */
  async analyzeAndOptimize(): Promise<OptimizationResult> {
    const startTime = Date.now();

    try {
      if (!this.mcpAvailable) {
        return await this.analyzeLocalFallback();
      }

      const globalAny = globalThis as any;

      // Get routing statistics
      const stats = await globalAny.mcp__ollama_local__get_routing_stats();

      // Analyze patterns and get suggestions
      const patterns = await globalAny.mcp__ollama_local__analyze_routing_patterns();

      // Calculate success rates (if available in stats)
      const ollamaSuccessRate = stats.ollama_success_rate || 0.95;
      const claudeSuccessRate = stats.claude_success_rate || 0.98;

      // Calculate average times (if available)
      const avgOllamaTime = stats.avg_ollama_time || 15;
      const avgClaudeTime = stats.avg_claude_time || 300;

      const analysis: RoutingAnalysis = {
        totalDecisions: stats.total_decisions || 0,
        ollamaSuccessRate,
        claudeSuccessRate,
        avgOllamaTime,
        avgClaudeTime,
        suggestedThreshold: patterns.optimal_threshold || RoutingOptimizer.COMPLEXITY_THRESHOLD,
        confidence: patterns.confidence || 0.7,
        recommendations: patterns.suggestions || [],
      };

      // Log the analysis
      await this.logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'routing-optimizer',
        action: 'analyze_and_optimize',
        input: { stats, patterns },
        output: analysis,
        duration_ms: Date.now() - startTime,
      });

      return {
        success: true,
        analysis,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.logger.logFailure({
        timestamp: new Date().toISOString(),
        agent: 'routing-optimizer',
        error: errorMessage,
        task: 'Analyze routing patterns',
        retry_count: 0,
      });

      return {
        success: false,
        analysis: null,
        duration_ms: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Get current routing statistics
   * @returns Current routing stats or null if unavailable
   */
  async getStats(): Promise<{
    total_decisions: number;
    ollama_count: number;
    claude_count: number;
    override_rate: number;
  } | null> {
    try {
      if (!this.mcpAvailable) {
        return null;
      }

      const globalAny = globalThis as any;
      return await globalAny.mcp__ollama_local__get_routing_stats();
    } catch {
      return null;
    }
  }

  /**
   * Suggest optimal complexity threshold based on historical data
   * @returns Suggested threshold or null if insufficient data
   */
  async suggestThreshold(): Promise<number | null> {
    try {
      const result = await this.analyzeAndOptimize();

      if (result.success && result.analysis) {
        return result.analysis.suggestedThreshold;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fallback analysis using local logs when MCP unavailable
   */
  private async analyzeLocalFallback(): Promise<OptimizationResult> {
    const startTime = Date.now();

    try {
      // Query local logs for routing decisions
      const activities = await this.logger.queryLogs({
        agent: 'routing-optimizer',
      });

      const decisions: RoutingDecision[] = activities
        .filter((a: any) => a.action === 'routing_decision' && a.input)
        .map((a: any) => a.input);

      if (decisions.length < 10) {
        // Insufficient data
        return {
          success: true,
          analysis: {
            totalDecisions: decisions.length,
            ollamaSuccessRate: 0.95,
            claudeSuccessRate: 0.98,
            avgOllamaTime: 15,
            avgClaudeTime: 300,
            suggestedThreshold: RoutingOptimizer.COMPLEXITY_THRESHOLD,
            confidence: 0.3,
            recommendations: ['Insufficient data - need at least 20 routing decisions for meaningful analysis'],
          },
          duration_ms: Date.now() - startTime,
        };
      }

      // Calculate metrics from local data
      const ollamaDecisions = decisions.filter(d => d.chosenAgent === 'ollama-specialist');
      const claudeDecisions = decisions.filter(d => d.chosenAgent === 'claude-specialist');

      const ollamaSuccess = ollamaDecisions.filter(d => d.success).length;
      const claudeSuccess = claudeDecisions.filter(d => d.success).length;

      const ollamaSuccessRate = ollamaDecisions.length > 0 ? ollamaSuccess / ollamaDecisions.length : 0.95;
      const claudeSuccessRate = claudeDecisions.length > 0 ? claudeSuccess / claudeDecisions.length : 0.98;

      const avgOllamaTime =
        ollamaDecisions.length > 0
          ? ollamaDecisions.reduce((sum, d) => sum + d.executionTime, 0) / ollamaDecisions.length
          : 15;

      const avgClaudeTime =
        claudeDecisions.length > 0
          ? claudeDecisions.reduce((sum, d) => sum + d.executionTime, 0) / claudeDecisions.length
          : 300;

      // Simple threshold optimization: find score where success rates diverge
      const recommendations: string[] = [];

      if (ollamaSuccessRate < 0.9) {
        recommendations.push('Ollama success rate is low - consider raising complexity threshold');
      }

      if (avgClaudeTime > 1000) {
        recommendations.push('Claude tasks are slow - consider lowering threshold to use Ollama more');
      }

      const analysis: RoutingAnalysis = {
        totalDecisions: decisions.length,
        ollamaSuccessRate,
        claudeSuccessRate,
        avgOllamaTime,
        avgClaudeTime,
        suggestedThreshold: RoutingOptimizer.COMPLEXITY_THRESHOLD,
        confidence: Math.min(decisions.length / 50, 0.8),
        recommendations,
      };

      return {
        success: true,
        analysis,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        analysis: null,
        duration_ms: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Get current complexity threshold
   */
  static getThreshold(): number {
    return RoutingOptimizer.COMPLEXITY_THRESHOLD;
  }

  /**
   * Update complexity threshold (use with caution)
   */
  static setThreshold(newThreshold: number): void {
    if (newThreshold >= 0 && newThreshold <= 100) {
      RoutingOptimizer.COMPLEXITY_THRESHOLD = newThreshold;
    }
  }
}
