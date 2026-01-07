import { StateManager } from '../state/StateManager';
import { SessionState, DEFAULT_SESSION_STATE } from '../state/schemas';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('StateManager', () => {
  let tempDir: string;
  let statePath: string;
  let stateManager: StateManager;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'state-test-'));
    statePath = path.join(tempDir, 'session_state.json');
    stateManager = new StateManager(statePath);
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    test('creates state file with defaults if missing', async () => {
      await stateManager.initialize();

      const exists = await fs.access(statePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const state = await stateManager.readState();
      expect(state.current_task).toBeNull();
      expect(state.assigned_agent).toBeNull();
      expect(state.agent_status).toEqual({});
    });

    test('does not overwrite existing state file', async () => {
      const customState: SessionState = {
        ...DEFAULT_SESSION_STATE,
        current_task: 'test-task',
        last_updated: new Date().toISOString(),
      };

      await stateManager.writeState(customState);
      await stateManager.initialize();

      const state = await stateManager.readState();
      expect(state.current_task).toBe('test-task');
    });
  });

  describe('readState', () => {
    test('reads valid state successfully', async () => {
      await stateManager.initialize();
      const state = await stateManager.readState();

      expect(state).toHaveProperty('current_task');
      expect(state).toHaveProperty('last_updated');
      expect(state).toHaveProperty('agent_status');
    });

    test('recovers from corrupt primary using backup', async () => {
      // Create valid backup
      const validState = { ...DEFAULT_SESSION_STATE };
      await stateManager.writeState(validState);
      await stateManager.createBackup();

      // Corrupt primary file
      await fs.writeFile(statePath, 'invalid json{{{', 'utf8');

      // Should recover from backup
      const state = await stateManager.readState();
      expect(state).toHaveProperty('current_task');
    });

    test('returns defaults if both primary and backup are corrupt', async () => {
      const backupPath = statePath.replace('.json', '.backup.json');

      // Create corrupt files
      await fs.writeFile(statePath, 'corrupt', 'utf8');
      await fs.writeFile(backupPath, 'also corrupt', 'utf8');

      const state = await stateManager.readState();
      expect(state.current_task).toBeNull();
    });
  });

  describe('writeState', () => {
    test('writes state atomically', async () => {
      const testState: SessionState = {
        ...DEFAULT_SESSION_STATE,
        current_task: 'atomic-write-test',
        last_updated: new Date().toISOString(),
      };

      await stateManager.writeState(testState);

      const content = await fs.readFile(statePath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.current_task).toBe('atomic-write-test');
    });

    test('updates last_updated timestamp automatically', async () => {
      const beforeTime = Date.now();
      await stateManager.initialize();

      await new Promise(resolve => setTimeout(resolve, 10));

      await stateManager.writeState(DEFAULT_SESSION_STATE);
      const state = await stateManager.readState();

      const stateTime = new Date(state.last_updated).getTime();
      expect(stateTime).toBeGreaterThanOrEqual(beforeTime);
    });

    test('creates formatted JSON with indentation', async () => {
      await stateManager.writeState(DEFAULT_SESSION_STATE);

      const content = await fs.readFile(statePath, 'utf8');
      expect(content).toContain('\n');
      expect(content).toContain('  '); // 2-space indentation
    });
  });

  describe('createBackup', () => {
    test('creates backup file', async () => {
      await stateManager.writeState(DEFAULT_SESSION_STATE);
      await stateManager.createBackup();

      const backupPath = statePath.replace('.json', '.backup.json');
      const exists = await fs.access(backupPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('backup contains same data as primary', async () => {
      const testState: SessionState = {
        ...DEFAULT_SESSION_STATE,
        current_task: 'backup-test',
        last_updated: new Date().toISOString(),
      };

      await stateManager.writeState(testState);
      await stateManager.createBackup();

      const backupPath = statePath.replace('.json', '.backup.json');
      const backupContent = await fs.readFile(backupPath, 'utf8');
      const backupState = JSON.parse(backupContent);

      expect(backupState.current_task).toBe('backup-test');
    });
  });

  describe('updateField', () => {
    test('updates single field without affecting others', async () => {
      await stateManager.initialize();

      await stateManager.updateField('current_task', 'new-task');
      await stateManager.updateField('complexity', 'complex');

      const state = await stateManager.readState();
      expect(state.current_task).toBe('new-task');
      expect(state.complexity).toBe('complex');
      expect(state.assigned_agent).toBeNull();
    });

    test('preserves type safety', async () => {
      await stateManager.initialize();

      await stateManager.updateField('agent_status', {
        'agent-1': 'active',
        'agent-2': 'idle'
      });

      const state = await stateManager.readState();
      expect(state.agent_status['agent-1']).toBe('active');
    });
  });

  describe('getState', () => {
    test('returns readonly state', async () => {
      await stateManager.initialize();
      const state = await stateManager.getState();

      expect(state).toHaveProperty('current_task');
      expect(state).toHaveProperty('agent_status');
    });
  });

  describe('file locking', () => {
    test('prevents concurrent writes', async () => {
      await stateManager.initialize();

      const state1: SessionState = {
        ...DEFAULT_SESSION_STATE,
        current_task: 'task-1',
        last_updated: new Date().toISOString(),
      };

      const state2: SessionState = {
        ...DEFAULT_SESSION_STATE,
        current_task: 'task-2',
        last_updated: new Date().toISOString(),
      };

      // Start concurrent writes
      const write1Promise = stateManager.writeState(state1);
      const write2Promise = stateManager.writeState(state2);

      // Both should complete (one waits for the other)
      await Promise.all([write1Promise, write2Promise]);

      // Final state should be one of them (not corrupted)
      const finalState = await stateManager.readState();
      expect(['task-1', 'task-2']).toContain(finalState.current_task);
    });

    test('releases lock after write completes', async () => {
      await stateManager.initialize();

      await stateManager.writeState(DEFAULT_SESSION_STATE);

      // Lock file should be removed
      const lockPath = statePath + '.lock';
      const lockExists = await fs.access(lockPath).then(() => true).catch(() => false);
      expect(lockExists).toBe(false);
    });
  });
});
