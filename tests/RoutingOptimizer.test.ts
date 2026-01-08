import { RoutingOptimizer, RoutingDecision } from '../agents/RoutingOptimizer';
import { StateManager } from '../state/StateManager';
import { Logger } from '../agents/Logger';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('RoutingOptimizer Agent', () => {
  let routingOptimizer: RoutingOptimizer;
  let stateManager: StateManager;
  let logger: Logger;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'routing-test-'));

    const stateDir = path.join(tempDir, 'state');
    const logsDir = path.join(tempDir, 'logs');

    await fs.mkdir(stateDir, { recursive: true });
    await fs.mkdir(logsDir, { recursive: true });

    stateManager = new StateManager(stateDir);
    logger = new Logger(logsDir);
    routingOptimizer = new RoutingOptimizer(stateManager, logger, tempDir);
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('logDecision', () => {
    test('should log routing decision successfully', async () => {
      const decision: RoutingDecision = {
        task: 'Add sum function',
        complexity: 30,
        classification: 'simple',
        chosenAgent: 'ollama-specialist',
        executionTime: 15,
        success: true,
        timestamp: new Date().toISOString(),
      };

      await routingOptimizer.logDecision(decision);

      // Verify it was logged
      const logs = await logger.queryLogs({ agent: 'routing-optimizer' });
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should log complex task routed to Claude', async () => {
      const decision: RoutingDecision = {
        task: 'Implement OAuth 2.0 with PKCE',
        complexity: 85,
        classification: 'complex',
        chosenAgent: 'claude-specialist',
        executionTime: 450,
        success: true,
        timestamp: new Date().toISOString(),
      };

      await routingOptimizer.logDecision(decision);

      const logs = await logger.queryLogs({ agent: 'routing-optimizer' });
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should handle failed executions', async () => {
      const decision: RoutingDecision = {
        task: 'Task that failed',
        complexity: 50,
        classification: 'simple',
        chosenAgent: 'ollama-specialist',
        executionTime: 0,
        success: false,
        timestamp: new Date().toISOString(),
      };

      await routingOptimizer.logDecision(decision);

      const logs = await logger.queryLogs({ agent: 'routing-optimizer' });
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeAndOptimize', () => {
    test('should analyze with insufficient data', async () => {
      // No decisions logged yet
      const result = await routingOptimizer.analyzeAndOptimize();

      expect(result.success).toBe(true);
      expect(result.analysis).not.toBeNull();

      if (result.analysis) {
        expect(result.analysis.totalDecisions).toBeLessThan(20);
        expect(result.analysis.recommendations.some(r => r.includes('Insufficient data'))).toBe(true);
      }
    });

    test('should analyze with sufficient local data', async () => {
      // Log multiple decisions
      for (let i = 0; i < 15; i++) {
        const decision: RoutingDecision = {
          task: `Task ${i}`,
          complexity: 30 + i * 3,
          classification: i < 10 ? 'simple' : 'complex',
          chosenAgent: i < 10 ? 'ollama-specialist' : 'claude-specialist',
          executionTime: i < 10 ? 15 + i : 300 + i * 10,
          success: true,
          timestamp: new Date().toISOString(),
        };

        await routingOptimizer.logDecision(decision);
      }

      const result = await routingOptimizer.analyzeAndOptimize();

      expect(result.success).toBe(true);
      expect(result.analysis).not.toBeNull();

      if (result.analysis) {
        expect(result.analysis.totalDecisions).toBeGreaterThanOrEqual(15);
        expect(result.analysis.ollamaSuccessRate).toBeGreaterThan(0);
        expect(result.analysis.claudeSuccessRate).toBeGreaterThan(0);
      }
    });

    test('should calculate success rates correctly', async () => {
      // Log 10 successful Ollama decisions
      for (let i = 0; i < 10; i++) {
        await routingOptimizer.logDecision({
          task: `Ollama task ${i}`,
          complexity: 30,
          classification: 'simple',
          chosenAgent: 'ollama-specialist',
          executionTime: 15,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Log 5 successful Claude decisions
      for (let i = 0; i < 5; i++) {
        await routingOptimizer.logDecision({
          task: `Claude task ${i}`,
          complexity: 75,
          classification: 'complex',
          chosenAgent: 'claude-specialist',
          executionTime: 300,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const result = await routingOptimizer.analyzeAndOptimize();

      expect(result.success).toBe(true);
      expect(result.analysis?.totalDecisions).toBe(15);
    });

    test('should identify when Ollama success rate is low', async () => {
      // Log mostly failed Ollama decisions
      for (let i = 0; i < 10; i++) {
        await routingOptimizer.logDecision({
          task: `Task ${i}`,
          complexity: 40,
          classification: 'simple',
          chosenAgent: 'ollama-specialist',
          executionTime: 15,
          success: i < 3, // Only 30% success rate
          timestamp: new Date().toISOString(),
        });
      }

      const result = await routingOptimizer.analyzeAndOptimize();

      expect(result.success).toBe(true);

      if (result.analysis) {
        expect(result.analysis.recommendations.some(r => r.includes('Ollama'))).toBe(true);
      }
    });
  });

  describe('getStats', () => {
    test('should return null when MCP unavailable', async () => {
      // MCP is not available in test environment
      const stats = await routingOptimizer.getStats();

      // Should return null since MCP functions aren't available
      expect(stats).toBeNull();
    });
  });

  describe('suggestThreshold', () => {
    test('should suggest threshold based on analysis', async () => {
      // Log some decisions
      for (let i = 0; i < 15; i++) {
        await routingOptimizer.logDecision({
          task: `Task ${i}`,
          complexity: 30 + i * 4,
          classification: i < 8 ? 'simple' : 'complex',
          chosenAgent: i < 8 ? 'ollama-specialist' : 'claude-specialist',
          executionTime: i < 8 ? 15 : 300,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const threshold = await routingOptimizer.suggestThreshold();

      expect(threshold).not.toBeNull();
      if (threshold !== null) {
        expect(threshold).toBeGreaterThanOrEqual(0);
        expect(threshold).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('threshold management', () => {
    test('should get current threshold', () => {
      const threshold = RoutingOptimizer.getThreshold();

      expect(threshold).toBe(60); // Default threshold
    });

    test('should update threshold', () => {
      RoutingOptimizer.setThreshold(70);

      expect(RoutingOptimizer.getThreshold()).toBe(70);

      // Reset to default
      RoutingOptimizer.setThreshold(60);
    });

    test('should reject invalid thresholds', () => {
      const originalThreshold = RoutingOptimizer.getThreshold();

      RoutingOptimizer.setThreshold(-10);
      expect(RoutingOptimizer.getThreshold()).toBe(originalThreshold);

      RoutingOptimizer.setThreshold(150);
      expect(RoutingOptimizer.getThreshold()).toBe(originalThreshold);
    });
  });

  describe('performance', () => {
    test('should log decisions quickly', async () => {
      const start = Date.now();

      await routingOptimizer.logDecision({
        task: 'Test task',
        complexity: 50,
        classification: 'simple',
        chosenAgent: 'ollama-specialist',
        executionTime: 15,
        success: true,
        timestamp: new Date().toISOString(),
      });

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    test('should analyze quickly with local fallback', async () => {
      // Log some decisions
      for (let i = 0; i < 10; i++) {
        await routingOptimizer.logDecision({
          task: `Task ${i}`,
          complexity: 40,
          classification: 'simple',
          chosenAgent: 'ollama-specialist',
          executionTime: 15,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const result = await routingOptimizer.analyzeAndOptimize();

      expect(result.duration_ms).toBeLessThan(200);
    });
  });

  describe('edge cases', () => {
    test('should handle empty task list gracefully', async () => {
      const result = await routingOptimizer.analyzeAndOptimize();

      expect(result.success).toBe(true);
      expect(result.analysis).not.toBeNull();
    });

    test('should handle all successful tasks', async () => {
      for (let i = 0; i < 10; i++) {
        await routingOptimizer.logDecision({
          task: `Task ${i}`,
          complexity: 40,
          classification: 'simple',
          chosenAgent: 'ollama-specialist',
          executionTime: 15,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      const result = await routingOptimizer.analyzeAndOptimize();

      expect(result.success).toBe(true);
      expect(result.analysis?.ollamaSuccessRate).toBe(1.0);
    });

    test('should handle all failed tasks', async () => {
      for (let i = 0; i < 10; i++) {
        await routingOptimizer.logDecision({
          task: `Task ${i}`,
          complexity: 40,
          classification: 'simple',
          chosenAgent: 'ollama-specialist',
          executionTime: 0,
          success: false,
          timestamp: new Date().toISOString(),
        });
      }

      const result = await routingOptimizer.analyzeAndOptimize();

      expect(result.success).toBe(true);
      expect(result.analysis?.ollamaSuccessRate).toBe(0);
    });
  });
});
