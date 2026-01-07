import { SessionManager } from '../agents/SessionManager';
import { StateManager } from '../state/StateManager';
import { SessionSummary } from '../state/schemas';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SessionManager', () => {
  let tempDir: string;
  let summaryPath: string;
  let statePath: string;
  let stateManager: StateManager;
  let sessionManager: SessionManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'session-test-'));
    summaryPath = path.join(tempDir, 'session_summary.json');
    statePath = path.join(tempDir, 'session_state.json');

    stateManager = new StateManager(statePath);
    await stateManager.initialize();

    sessionManager = new SessionManager(summaryPath, stateManager);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    test('creates new session with UUID if file missing', async () => {
      const summary = await sessionManager.initialize();

      expect(summary.session_id).toBeDefined();
      expect(summary.session_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(summary.start_time).toBeDefined();
      expect(summary.end_time).toBeNull();
      expect(summary.accomplished).toEqual([]);
      expect(summary.incomplete_tasks).toEqual([]);
      expect(summary.system_health).toBe('healthy');
    });

    test('writes session summary file', async () => {
      await sessionManager.initialize();

      const exists = await fs.access(summaryPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('reads existing session', async () => {
      const existingSummary: SessionSummary = {
        session_id: 'test-session-123',
        start_time: new Date().toISOString(),
        end_time: null,
        accomplished: ['task-1', 'task-2'],
        next_steps: ['task-3'],
        incomplete_tasks: [],
        system_health: 'healthy',
      };

      await fs.writeFile(summaryPath, JSON.stringify(existingSummary, null, 2), 'utf8');

      const summary = await sessionManager.initialize();
      expect(summary.session_id).toBe('test-session-123');
      expect(summary.accomplished).toHaveLength(2);
    });

    test('preserves existing session data', async () => {
      const existingSummary: SessionSummary = {
        session_id: 'existing-session',
        start_time: '2024-01-01T00:00:00.000Z',
        end_time: null,
        accomplished: ['previous-task'],
        next_steps: [],
        incomplete_tasks: ['pending-task'],
        system_health: 'degraded',
      };

      await fs.writeFile(summaryPath, JSON.stringify(existingSummary), 'utf8');

      const summary = await sessionManager.initialize();
      expect(summary.accomplished).toContain('previous-task');
      expect(summary.incomplete_tasks).toContain('pending-task');
      expect(summary.system_health).toBe('degraded');
    });
  });

  describe('finalize', () => {
    test('writes session with end_time', async () => {
      const summary = await sessionManager.initialize();
      const beforeFinalize = Date.now();

      await sessionManager.finalize(summary);

      const content = await fs.readFile(summaryPath, 'utf8');
      const saved = JSON.parse(content) as SessionSummary;

      expect(saved.end_time).not.toBeNull();
      const endTime = new Date(saved.end_time!).getTime();
      expect(endTime).toBeGreaterThanOrEqual(beforeFinalize);
    });

    test('preserves all session data', async () => {
      const summary = await sessionManager.initialize();
      summary.accomplished = ['completed-1', 'completed-2'];
      summary.incomplete_tasks = ['pending-1'];

      await sessionManager.finalize(summary);

      const content = await fs.readFile(summaryPath, 'utf8');
      const saved = JSON.parse(content) as SessionSummary;

      expect(saved.accomplished).toEqual(['completed-1', 'completed-2']);
      expect(saved.incomplete_tasks).toEqual(['pending-1']);
    });
  });

  describe('validateSession', () => {
    test('returns true for valid session', async () => {
      await sessionManager.initialize();

      const isValid = await sessionManager.validateSession();
      expect(isValid).toBe(true);
    });

    test('returns false if session_id missing', async () => {
      const invalidSummary = {
        session_id: '',
        start_time: new Date().toISOString(),
        end_time: null,
        accomplished: [],
        next_steps: [],
        incomplete_tasks: [],
        system_health: 'healthy' as const,
      };

      await fs.writeFile(summaryPath, JSON.stringify(invalidSummary), 'utf8');

      const isValid = await sessionManager.validateSession();
      expect(isValid).toBe(false);
    });

    test('returns false if system health is failed', async () => {
      const summary = await sessionManager.initialize();
      summary.system_health = 'failed';
      await fs.writeFile(summaryPath, JSON.stringify(summary), 'utf8');

      const isValid = await sessionManager.validateSession();
      expect(isValid).toBe(false);
    });

    test('validates state manager connectivity', async () => {
      await sessionManager.initialize();

      const isValid = await sessionManager.validateSession();
      expect(isValid).toBe(true);
    });
  });

  describe('addAccomplishment', () => {
    test('adds task to accomplished array', async () => {
      await sessionManager.initialize();

      await sessionManager.addAccomplishment('Complete feature X');

      const summary = await sessionManager.initialize();
      expect(summary.accomplished).toContain('Complete feature X');
    });

    test('removes task from incomplete_tasks if present', async () => {
      await sessionManager.initialize();
      await sessionManager.addIncompleteTask('Task Y');
      await sessionManager.addAccomplishment('Task Y');

      const summary = await sessionManager.initialize();
      expect(summary.accomplished).toContain('Task Y');
      expect(summary.incomplete_tasks).not.toContain('Task Y');
    });

    test('allows multiple accomplishments', async () => {
      await sessionManager.initialize();

      await sessionManager.addAccomplishment('Task 1');
      await sessionManager.addAccomplishment('Task 2');
      await sessionManager.addAccomplishment('Task 3');

      const summary = await sessionManager.initialize();
      expect(summary.accomplished).toHaveLength(3);
    });
  });

  describe('addIncompleteTask', () => {
    test('adds task to incomplete_tasks array', async () => {
      await sessionManager.initialize();

      await sessionManager.addIncompleteTask('Pending task Z');

      const summary = await sessionManager.initialize();
      expect(summary.incomplete_tasks).toContain('Pending task Z');
    });

    test('does not add duplicate tasks', async () => {
      await sessionManager.initialize();

      await sessionManager.addIncompleteTask('Duplicate task');
      await sessionManager.addIncompleteTask('Duplicate task');

      const summary = await sessionManager.initialize();
      const count = summary.incomplete_tasks.filter(t => t === 'Duplicate task').length;
      expect(count).toBe(1);
    });
  });

  describe('updateSystemHealth', () => {
    test('updates health status to degraded', async () => {
      await sessionManager.initialize();

      await sessionManager.updateSystemHealth('degraded');

      const summary = await sessionManager.initialize();
      expect(summary.system_health).toBe('degraded');
    });

    test('updates health status to failed', async () => {
      await sessionManager.initialize();

      await sessionManager.updateSystemHealth('failed');

      const summary = await sessionManager.initialize();
      expect(summary.system_health).toBe('failed');
    });

    test('updates health status back to healthy', async () => {
      await sessionManager.initialize();
      await sessionManager.updateSystemHealth('degraded');

      await sessionManager.updateSystemHealth('healthy');

      const summary = await sessionManager.initialize();
      expect(summary.system_health).toBe('healthy');
    });
  });
});
