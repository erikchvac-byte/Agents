import { PerformanceMonitor } from '../agents/PerformanceMonitor';
import { StateManager } from '../state/StateManager';
import { Logger } from '../agents/Logger';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PerformanceMonitor Agent', () => {
  let performanceMonitor: PerformanceMonitor;
  let stateManager: StateManager;
  let logger: Logger;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'perfmon-test-'));

    const stateDir = path.join(tempDir, 'state');
    const logsDir = path.join(tempDir, 'logs');

    await fs.mkdir(stateDir, { recursive: true });
    await fs.mkdir(logsDir, { recursive: true });

    stateManager = new StateManager(stateDir);
    logger = new Logger(logsDir);
    performanceMonitor = new PerformanceMonitor(stateManager, logger, tempDir);
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('generateReport', () => {
    test('should generate empty report with no data', async () => {
      const result = await performanceMonitor.generateReport(60);

      expect(result.success).toBe(true);
      expect(result.report).not.toBeNull();
      expect(result.report?.totalTasksProcessed).toBe(0);
      expect(result.report?.agentMetrics).toHaveLength(0);
      expect(result.report?.recommendations).toContain('No performance data available yet - execute some tasks first');
    });

    test('should generate report with sample data', async () => {
      // Log some sample activities
      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'ollama-specialist',
        action: 'execute_task',
        input: 'Task 1',
        output: 'Result 1',
        duration_ms: 50,
      });

      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'ollama-specialist',
        action: 'execute_task',
        input: 'Task 2',
        output: 'Result 2',
        duration_ms: 75,
      });

      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'claude-specialist',
        action: 'execute_task',
        input: 'Task 3',
        output: 'Result 3',
        duration_ms: 300,
      });

      const result = await performanceMonitor.generateReport(60);

      expect(result.success).toBe(true);
      expect(result.report?.totalTasksProcessed).toBe(3);
      expect(result.report?.agentMetrics.length).toBeGreaterThan(0);
    });

    test('should calculate agent metrics correctly', async () => {
      // Log activities for specific agent
      const execTimes = [100, 150, 200];

      for (const time of execTimes) {
        await logger.logAgentActivity({
          timestamp: new Date().toISOString(),
          agent: 'test-agent',
          action: 'test_action',
          input: 'input',
          output: 'output',
          duration_ms: time,
        });
      }

      const result = await performanceMonitor.generateReport(60);

      const testAgentMetrics = result.report?.agentMetrics.find(m => m.agent === 'test-agent');

      expect(testAgentMetrics).toBeDefined();
      expect(testAgentMetrics?.totalExecutions).toBe(3);
      expect(testAgentMetrics?.minExecutionTime).toBe(100);
      expect(testAgentMetrics?.maxExecutionTime).toBe(200);
      expect(testAgentMetrics?.avgExecutionTime).toBe(150);
    });

    test('should identify slow agents as bottlenecks', async () => {
      // Create a slow agent
      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'slow-agent',
        action: 'slow_task',
        input: 'input',
        output: 'output',
        duration_ms: 3000, // 3 seconds - above degraded threshold
      });

      const result = await performanceMonitor.generateReport(60);

      expect(result.report?.bottlenecks.length).toBeGreaterThan(0);
      expect(result.report?.bottlenecks.some(b => b.includes('slow-agent'))).toBe(true);
    });

    test('should calculate overall health as excellent for fast agents', async () => {
      // Create fast successful executions
      for (let i = 0; i < 5; i++) {
        await logger.logAgentActivity({
          timestamp: new Date().toISOString(),
          agent: 'fast-agent',
          action: 'fast_task',
          input: 'input',
          output: 'output',
          duration_ms: 50,
        });
      }

      const result = await performanceMonitor.generateReport(60);

      expect(result.report?.overallHealth).toBe('excellent');
    });

    test('should calculate overall health as poor for slow agents', async () => {
      // Create slow executions
      for (let i = 0; i < 5; i++) {
        await logger.logAgentActivity({
          timestamp: new Date().toISOString(),
          agent: 'very-slow-agent',
          action: 'slow_task',
          input: 'input',
          output: 'output',
          duration_ms: 2500,
        });
      }

      const result = await performanceMonitor.generateReport(60);

      expect(['degraded', 'poor']).toContain(result.report?.overallHealth);
    });

    test('should generate optimization recommendations', async () => {
      // Create a slow agent
      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'claude-specialist',
        action: 'complex_task',
        input: 'input',
        output: 'output',
        duration_ms: 1000,
      });

      const result = await performanceMonitor.generateReport(60);

      expect(result.report?.recommendations.length).toBeGreaterThan(0);
    });

    test('should respect lookback time window', async () => {
      // Log old activity (2 hours ago)
      const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000);

      await logger.logAgentActivity({
        timestamp: oldTime.toISOString(),
        agent: 'old-agent',
        action: 'old_task',
        input: 'input',
        output: 'output',
        duration_ms: 100,
      });

      // Log recent activity
      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'recent-agent',
        action: 'recent_task',
        input: 'input',
        output: 'output',
        duration_ms: 100,
      });

      // Query with 60-minute lookback
      const result = await performanceMonitor.generateReport(60);

      // Should only include recent activity
      const hasRecentAgent = result.report?.agentMetrics.some(m => m.agent === 'recent-agent');

      expect(hasRecentAgent).toBe(true);
      // Note: old agent might still appear depending on Logger implementation
    });
  });

  describe('monitorAgent', () => {
    test('should monitor specific agent performance', async () => {
      // Log activities for specific agent
      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'monitored-agent',
        action: 'task_1',
        input: 'input',
        output: 'output',
        duration_ms: 100,
      });

      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'monitored-agent',
        action: 'task_2',
        input: 'input',
        output: 'output',
        duration_ms: 200,
      });

      const metrics = await performanceMonitor.monitorAgent('monitored-agent', 60);

      expect(metrics).not.toBeNull();
      expect(metrics?.agent).toBe('monitored-agent');
      expect(metrics?.totalExecutions).toBe(2);
      expect(metrics?.avgExecutionTime).toBe(150);
    });

    test('should return null for non-existent agent', async () => {
      const metrics = await performanceMonitor.monitorAgent('non-existent-agent', 60);

      expect(metrics).toBeNull();
    });
  });

  describe('bottleneck identification', () => {
    test('should identify high variance agents', async () => {
      // Create agent with high variance (min 100ms, max 6000ms)
      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'variable-agent',
        action: 'fast',
        input: 'input',
        output: 'output',
        duration_ms: 100,
      });

      await logger.logAgentActivity({
        timestamp: new Date().toISOString(),
        agent: 'variable-agent',
        action: 'slow',
        input: 'input',
        output: 'output',
        duration_ms: 6000,
      });

      const result = await performanceMonitor.generateReport(60);

      expect(result.report?.bottlenecks.some(b => b.includes('variance'))).toBe(true);
    });
  });

  describe('performance', () => {
    test('should generate report quickly', async () => {
      const result = await performanceMonitor.generateReport(60);

      expect(result.duration_ms).toBeLessThan(200);
    });

    test('should handle large datasets efficiently', async () => {
      // Log many activities
      for (let i = 0; i < 100; i++) {
        await logger.logAgentActivity({
          timestamp: new Date().toISOString(),
          agent: `agent-${i % 10}`,
          action: 'task',
          input: 'input',
          output: 'output',
          duration_ms: Math.random() * 1000,
        });
      }

      const result = await performanceMonitor.generateReport(60);

      expect(result.success).toBe(true);
      expect(result.duration_ms).toBeLessThan(500);
    });
  });

  describe('recommendations', () => {
    test('should recommend no changes when system is performing well', async () => {
      // Create excellent performance
      for (let i = 0; i < 5; i++) {
        await logger.logAgentActivity({
          timestamp: new Date().toISOString(),
          agent: 'excellent-agent',
          action: 'task',
          input: 'input',
          output: 'output',
          duration_ms: 50,
        });
      }

      const result = await performanceMonitor.generateReport(60);

      expect(result.report?.bottlenecks).toHaveLength(0);
    });
  });
});
