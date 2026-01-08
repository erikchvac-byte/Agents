import { AutoDebug } from '../agents/AutoDebug';
import { StateManager } from '../state/StateManager';
import { Logger } from '../agents/Logger';
import { FailureEvent } from '../state/schemas';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AutoDebug Agent', () => {
  let autoDebug: AutoDebug;
  let stateManager: StateManager;
  let logger: Logger;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autodebug-test-'));

    const stateDir = path.join(tempDir, 'state');
    const logsDir = path.join(tempDir, 'logs');

    await fs.mkdir(stateDir, { recursive: true });
    await fs.mkdir(logsDir, { recursive: true });

    stateManager = new StateManager(stateDir);
    logger = new Logger(logsDir);
    autoDebug = new AutoDebug(stateManager, logger, tempDir);
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('analyzeFailure', () => {
    test('should identify null reference errors', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'test-agent',
        error: "Cannot read property 'name' of undefined",
        task: 'Test task',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.success).toBe(true);
      expect(result.analysis).not.toBeNull();
      expect(result.analysis?.errorType).toBe('NullReferenceError');
      expect(result.analysis?.severity).toBe('high');
      expect(result.analysis?.suggestedFixes.length).toBeGreaterThan(0);
      expect(result.analysis?.confidence).toBeGreaterThan(60);
    });

    test('should identify module not found errors', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'ollama-specialist',
        error: "Cannot find module 'missing-package'",
        task: 'Import package',
        retry_count: 1,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.success).toBe(true);
      expect(result.analysis?.errorType).toBe('ModuleNotFoundError');
      expect(result.analysis?.severity).toBe('critical');
      expect(result.analysis?.suggestedFixes).toContain('Install the missing npm package');
    });

    test('should identify syntax errors', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'claude-specialist',
        error: 'Unexpected token }',
        task: 'Parse code',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.success).toBe(true);
      expect(result.analysis?.errorType).toBe('SyntaxError');
      expect(result.analysis?.severity).toBe('critical');
    });

    test('should identify TypeScript type errors', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'critic',
        error: "Type 'string' is not assignable to type 'number'",
        task: 'Type check',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.success).toBe(true);
      expect(result.analysis?.errorType).toBe('TypeScriptTypeError');
      expect(result.analysis?.severity).toBe('medium');
    });

    test('should identify file not found errors', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'watcher',
        error: 'ENOENT: no such file or directory',
        task: 'Watch file',
        retry_count: 2,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.success).toBe(true);
      expect(result.analysis?.errorType).toBe('FileNotFoundError');
      expect(result.analysis?.severity).toBe('medium');
    });

    test('should handle unknown error patterns', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'custom-agent',
        error: 'Something very specific went wrong',
        task: 'Custom task',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.success).toBe(true);
      expect(result.analysis?.errorType).toBe('UnknownError');
      expect(result.analysis?.confidence).toBeLessThan(50);
      expect(result.analysis?.suggestedFixes).toContain('Review error stack trace carefully');
    });

    test('should extract affected components from error', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'pipeline',
        error: 'Error at agents/Router.ts:42 in analyzeComplexity',
        task: 'Route task',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.success).toBe(true);
      expect(result.analysis?.affectedComponents).toContain('pipeline');
      expect(result.analysis?.affectedComponents.some(c => c.includes('Router.ts'))).toBe(true);
    });
  });

  describe('analyzePatterns', () => {
    test('should identify common error patterns', async () => {
      const failures: FailureEvent[] = [
        {
          timestamp: new Date().toISOString(),
          agent: 'agent-1',
          error: "Cannot read property 'x' of undefined",
          task: 'Task 1',
          retry_count: 0,
        },
        {
          timestamp: new Date().toISOString(),
          agent: 'agent-1',
          error: "Cannot read property 'y' of null",
          task: 'Task 2',
          retry_count: 1,
        },
        {
          timestamp: new Date().toISOString(),
          agent: 'agent-2',
          error: 'Unexpected token {',
          task: 'Task 3',
          retry_count: 0,
        },
      ];

      const patterns = await autoDebug.analyzePatterns(failures);

      expect(patterns.commonErrors.length).toBeGreaterThan(0);
      expect(patterns.commonErrors[0]).toBe('NullReferenceError');
      expect(patterns.mostAffectedAgent).toBe('agent-1');
      expect(patterns.recommendations.length).toBeGreaterThan(0);
    });

    test('should track time distribution', async () => {
      const now = new Date();
      const failures: FailureEvent[] = [
        {
          timestamp: now.toISOString(),
          agent: 'test-agent',
          error: 'Error 1',
          task: 'Task 1',
          retry_count: 0,
        },
        {
          timestamp: now.toISOString(),
          agent: 'test-agent',
          error: 'Error 2',
          task: 'Task 2',
          retry_count: 0,
        },
      ];

      const patterns = await autoDebug.analyzePatterns(failures);

      expect(Object.keys(patterns.timeDistribution).length).toBeGreaterThan(0);
    });

    test('should generate agent-specific recommendations', async () => {
      const failures: FailureEvent[] = Array(5)
        .fill(null)
        .map(() => ({
          timestamp: new Date().toISOString(),
          agent: 'problematic-agent',
          error: 'Recurring error',
          task: 'Some task',
          retry_count: 0,
        }));

      const patterns = await autoDebug.analyzePatterns(failures);

      expect(patterns.mostAffectedAgent).toBe('problematic-agent');
      expect(patterns.recommendations.some(r => r.includes('problematic-agent'))).toBe(true);
    });
  });

  describe('error pattern matching', () => {
    test('should match stack overflow errors', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'test',
        error: 'Maximum call stack size exceeded',
        task: 'Recursive call',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.analysis?.errorType).toBe('StackOverflowError');
      expect(result.analysis?.severity).toBe('critical');
    });

    test('should match timeout errors', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'test',
        error: 'Operation timed out after 30s',
        task: 'Long operation',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.analysis?.errorType).toBe('TimeoutError');
    });

    test('should match permission errors', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'test',
        error: 'EACCES: permission denied',
        task: 'Write file',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.analysis?.errorType).toBe('PermissionError');
      expect(result.analysis?.severity).toBe('high');
    });
  });

  describe('confidence calculation', () => {
    test('should have higher confidence for known patterns', async () => {
      const knownError: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'test',
        error: "Cannot read property 'x' of undefined",
        task: 'Task',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(knownError);

      expect(result.analysis?.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should have lower confidence for unknown patterns', async () => {
      const unknownError: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'test',
        error: 'Very specific custom error XYZ123',
        task: 'Task',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(unknownError);

      expect(result.analysis?.confidence).toBeLessThanOrEqual(50);
    });
  });

  describe('performance', () => {
    test('should analyze failure quickly', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'test',
        error: 'Test error',
        task: 'Test',
        retry_count: 0,
      };

      const result = await autoDebug.analyzeFailure(failure);

      expect(result.duration_ms).toBeLessThan(100);
    });
  });
});
