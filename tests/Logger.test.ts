import { Logger } from '../agents/Logger';
import { AgentActivity, FailureEvent, FixEvent, LogFilter } from '../state/schemas';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Logger', () => {
  let tempDir: string;
  let logger: Logger;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'logger-test-'));
    logger = new Logger(tempDir);
    await logger.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    test('creates conversation_logs directory', async () => {
      const logsDir = path.join(tempDir, 'conversation_logs');
      const exists = await fs.access(logsDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('logAgentActivity', () => {
    test('creates per-agent, per-day log files', async () => {
      const activity: AgentActivity = {
        timestamp: new Date().toISOString(),
        agent: 'test-agent',
        action: 'test-action',
        input: { test: 'data' },
        output: { result: 'success' },
        duration_ms: 100,
      };

      await logger.logAgentActivity(activity);

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(tempDir, 'conversation_logs', `test-agent_${date}.log`);
      const exists = await fs.access(logFile).then(() => true).catch(() => false);

      expect(exists).toBe(true);
    });

    test('appends to existing log file', async () => {
      const activity1: AgentActivity = {
        timestamp: new Date().toISOString(),
        agent: 'test-agent',
        action: 'action-1',
        input: {},
        output: {},
        duration_ms: 50,
      };

      const activity2: AgentActivity = {
        timestamp: new Date().toISOString(),
        agent: 'test-agent',
        action: 'action-2',
        input: {},
        output: {},
        duration_ms: 75,
      };

      await logger.logAgentActivity(activity1);
      await logger.logAgentActivity(activity2);

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(tempDir, 'conversation_logs', `test-agent_${date}.log`);
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(2);
    });

    test('writes valid JSONL format', async () => {
      const activity: AgentActivity = {
        timestamp: new Date().toISOString(),
        agent: 'test-agent',
        action: 'test',
        input: {},
        output: {},
        duration_ms: 10,
      };

      await logger.logAgentActivity(activity);

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(tempDir, 'conversation_logs', `test-agent_${date}.log`);
      const content = await fs.readFile(logFile, 'utf8');
      const line = content.trim();

      expect(() => JSON.parse(line)).not.toThrow();
      const parsed = JSON.parse(line);
      expect(parsed.agent).toBe('test-agent');
    });
  });

  describe('logFailure', () => {
    test('appends to failure_events.jsonl', async () => {
      const failure: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'test-agent',
        error: 'Test error message',
        task: 'test-task',
        retry_count: 1,
      };

      await logger.logFailure(failure);

      const logFile = path.join(tempDir, 'failure_events.jsonl');
      const exists = await fs.access(logFile).then(() => true).catch(() => false);

      expect(exists).toBe(true);

      const content = await fs.readFile(logFile, 'utf8');
      expect(content).toContain('Test error message');
    });

    test('appends multiple failures', async () => {
      const failure1: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'agent-1',
        error: 'Error 1',
        task: 'task-1',
        retry_count: 0,
      };

      const failure2: FailureEvent = {
        timestamp: new Date().toISOString(),
        agent: 'agent-2',
        error: 'Error 2',
        task: 'task-2',
        retry_count: 1,
      };

      await logger.logFailure(failure1);
      await logger.logFailure(failure2);

      const logFile = path.join(tempDir, 'failure_events.jsonl');
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(2);
    });
  });

  describe('logFix', () => {
    test('appends to applied_fixes.jsonl', async () => {
      const fix: FixEvent = {
        timestamp: new Date().toISOString(),
        agent: 'linter-fixer',
        original_issue: 'Linting error',
        fix_applied: 'Added semicolon',
        files_modified: ['file1.ts', 'file2.ts'],
      };

      await logger.logFix(fix);

      const logFile = path.join(tempDir, 'applied_fixes.jsonl');
      const exists = await fs.access(logFile).then(() => true).catch(() => false);

      expect(exists).toBe(true);

      const content = await fs.readFile(logFile, 'utf8');
      const parsed = JSON.parse(content.trim());
      expect(parsed.agent).toBe('linter-fixer');
      expect(parsed.files_modified).toHaveLength(2);
    });
  });

  describe('pruneLogs', () => {
    test('deletes conversation logs older than 7 days', async () => {
      // Create old log file
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      const oldDateStr = oldDate.toISOString().split('T')[0];

      const oldLogFile = path.join(tempDir, 'conversation_logs', `old-agent_${oldDateStr}.log`);
      await fs.writeFile(oldLogFile, JSON.stringify({ test: 'old' }), 'utf8');

      // Change modification time to 8 days ago
      const oldTime = Date.now() - (8 * 24 * 60 * 60 * 1000);
      await fs.utimes(oldLogFile, new Date(oldTime), new Date(oldTime));

      await logger.pruneLogs();

      const exists = await fs.access(oldLogFile).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    test('keeps recent conversation logs', async () => {
      const activity: AgentActivity = {
        timestamp: new Date().toISOString(),
        agent: 'recent-agent',
        action: 'test',
        input: {},
        output: {},
        duration_ms: 10,
      };

      await logger.logAgentActivity(activity);
      await logger.pruneLogs();

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(tempDir, 'conversation_logs', `recent-agent_${date}.log`);
      const exists = await fs.access(logFile).then(() => true).catch(() => false);

      expect(exists).toBe(true);
    });
  });

  describe('queryLogs', () => {
    beforeEach(async () => {
      // Seed some test data
      const activity1: AgentActivity = {
        timestamp: new Date().toISOString(),
        agent: 'agent-1',
        action: 'test-1',
        input: {},
        output: {},
        duration_ms: 100,
      };

      const activity2: AgentActivity = {
        timestamp: new Date().toISOString(),
        agent: 'agent-2',
        action: 'test-2',
        input: {},
        output: {},
        duration_ms: 200,
      };

      await logger.logAgentActivity(activity1);
      await logger.logAgentActivity(activity2);
    });

    test('filters by agent name', async () => {
      const filter: LogFilter = { agent: 'agent-1' };
      const results = await logger.queryLogs(filter);

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        const parsed = JSON.parse(result);
        expect(parsed.agent).toBe('agent-1');
      });
    });

    test('returns all logs when no filter provided', async () => {
      const filter: LogFilter = {};
      const results = await logger.queryLogs(filter);

      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    test('filters by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const filter: LogFilter = {
        start_date: yesterday.toISOString(),
        end_date: now.toISOString(),
      };

      const results = await logger.queryLogs(filter);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
