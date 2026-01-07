/**
 * Integration Test: End-to-End Pipeline
 *
 * Tests the complete workflow:
 * User Task → Router → Meta-Coordinator → Ollama → Logger → State
 *
 * This test proves the MVP concept works.
 */

import { Pipeline } from '../pipeline';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Pipeline Integration Test', () => {
  let tempDir: string;
  let pipeline: Pipeline;

  beforeEach(async () => {
    // Create temporary directory for test isolation
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-test-'));

    // Create required subdirectories
    await fs.mkdir(path.join(tempDir, 'state'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'logs'), { recursive: true });

    // Initialize pipeline with temp directory, MCP disabled, Critic disabled, Architect disabled for testing
    pipeline = new Pipeline(tempDir, false, false, false); // useMCP = false, enableCritic = false, enableArchitect = false for deterministic tests
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('executes simple task end-to-end', async () => {
    // ARRANGE
    const task = 'Add a function to sum two numbers';

    // ACT
    const result = await pipeline.executeTask(task);

    // ASSERT - Verify success
    expect(result.success).toBe(true);
    expect(result.task).toBe(task);
    expect(result.error).toBeUndefined();

    // ASSERT - Verify routing
    expect(result.complexity).toBe('simple');
    expect(result.assignedAgent).toBe('ollama-specialist');

    // ASSERT - Verify output contains code
    expect(result.output).toBeTruthy();
    expect(result.output).toContain('function sum');
    expect(result.output).toContain('number');

    // ASSERT - Verify performance
    expect(result.totalDuration).toBeLessThan(5000); // Should complete in < 5s
  }, 10000); // 10 second timeout

  test('state persists correctly', async () => {
    // ARRANGE
    const task = 'Add a function to multiply two numbers';

    // ACT
    await pipeline.executeTask(task);

    // ASSERT - Verify state file exists and contains correct data
    const statePath = path.join(tempDir, 'state', 'session_state.json');
    const stateExists = await fs
      .access(statePath)
      .then(() => true)
      .catch(() => false);

    expect(stateExists).toBe(true);

    const stateContent = await fs.readFile(statePath, 'utf8');
    const state = JSON.parse(stateContent);

    expect(state.current_task).toBe(task);
    expect(state.assigned_agent).toBe('ollama-specialist');
    expect(state.complexity).toBe('simple');
    expect(state.last_updated).toBeTruthy();
  }, 10000);

  test('logs capture workflow', async () => {
    // ARRANGE
    const task = 'Add a function to calculate area';

    // ACT
    await pipeline.executeTask(task);

    // ASSERT - Verify conversation logs exist
    const logsDir = path.join(tempDir, 'logs', 'conversation_logs');
    const logFiles = await fs.readdir(logsDir);

    // Should have logs from router, meta-coordinator, and ollama-specialist
    const routerLogs = logFiles.filter((f) => f.startsWith('router_'));
    const metaLogs = logFiles.filter((f) => f.startsWith('meta-coordinator_'));
    const ollamaLogs = logFiles.filter((f) => f.startsWith('ollama-specialist_'));

    expect(routerLogs.length).toBeGreaterThan(0);
    expect(metaLogs.length).toBeGreaterThan(0);
    expect(ollamaLogs.length).toBeGreaterThan(0);

    // ASSERT - Verify log content
    const routerLogContent = await fs.readFile(
      path.join(logsDir, routerLogs[0]),
      'utf8'
    );
    const routerLogEntry = JSON.parse(routerLogContent.trim());

    expect(routerLogEntry.agent).toBe('router');
    expect(routerLogEntry.action).toBe('analyze_complexity');
    expect(routerLogEntry.input.task).toBe(task);
    expect(routerLogEntry.output.complexity).toBe('simple');
  }, 10000);

  test('complex tasks route correctly', async () => {
    // ARRANGE
    const complexTask = 'Refactor the authentication architecture with OAuth integration';

    // ACT
    const result = await pipeline.executeTask(complexTask);

    // ASSERT - Should be classified as complex
    expect(result.complexity).toBe('complex');

    // Should route to claude-specialist for complex tasks
    expect(result.assignedAgent).toBe('claude-specialist');

    // Note: ClaudeSpecialist will fail in test environment without Task tool
    // This is expected - the test verifies routing logic, not execution
    expect(result.success).toBe(false); // Task tool not available in tests
    expect(result.error).toContain('Task tool not available');
  }, 10000);

  test('session tracking works', async () => {
    // ARRANGE
    const task1 = 'Add function A';
    const task2 = 'Add function B';

    // ACT - Execute multiple tasks
    await pipeline.executeTask(task1);
    await pipeline.executeTask(task2);

    // ASSERT - Verify session summary tracks accomplishments
    const summaryPath = path.join(tempDir, 'state', 'session_summary.json');
    const summaryContent = await fs.readFile(summaryPath, 'utf8');
    const summary = JSON.parse(summaryContent);

    expect(summary.session_id).toBeTruthy();
    expect(summary.accomplished).toContain(task1);
    expect(summary.accomplished).toContain(task2);
    expect(summary.accomplished.length).toBe(2);
    expect(summary.system_health).toBe('healthy');
  }, 15000);
});
