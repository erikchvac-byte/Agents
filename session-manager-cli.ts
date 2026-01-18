#!/usr/bin/env node

/**
 * Session Manager CLI Interface
 * 
 * Usage:
 *   npm run session:start  - Initialize or resume session
 *   npm run session:end    - Finalize current session
 */

import { SessionManager } from './agents/SessionManager';
import { StateManager } from './state/StateManager';
import * as path from 'path';

// Get command line arguments
const command = process.argv[2];
const workingDir = process.cwd();

async function main() {
  // Initialize paths
  const summaryPath = path.join(workingDir, 'session_summary.json');
  const statePath = path.join(workingDir, 'state', 'session_state.json');

  // Initialize dependencies
  const stateManager = new StateManager(statePath);
  const sessionManager = new SessionManager(summaryPath, stateManager);

  try {
    switch (command) {
      case 'start':
        console.log('=== Session Manager: Start ===\n');
        const session = await sessionManager.initialize();
        
        console.log('\n--- Session Summary ---');
        console.log(`Session ID: ${session.session_id}`);
        console.log(`Start Time: ${session.start_time}`);
        console.log(`System Health: ${session.system_health}`);
        console.log(`Accomplished: ${session.accomplished.length} tasks`);
        console.log(`Incomplete: ${session.incomplete_tasks.length} tasks`);
        
        if (session.incomplete_tasks.length > 0) {
          console.log('\nIncomplete Tasks:');
          session.incomplete_tasks.forEach((task, i) => {
            console.log(`  ${i + 1}. ${task}`);
          });
        }
        
        // Validate session
        const isValid = await sessionManager.validateSession();
        console.log(`\nSession Valid: ${isValid ? '✅' : '❌'}`);
        break;

      case 'end':
        console.log('=== Session Manager: End ===\n');
        
        // Read current session
        const currentSession = await sessionManager.initialize();
        console.log(`Finalizing session: ${currentSession.session_id}`);
        
        // Add example accomplishment (in real usage, this would be populated by actual work)
        if (currentSession.accomplished.length === 0) {
          await sessionManager.addAccomplishment('Session management test');
        }
        
        // Finalize
        await sessionManager.finalize(currentSession);
        console.log('Session finalized successfully!');
        break;

      default:
        console.error('Usage: npm run session:start | npm run session:end');
        process.exit(1);
    }
  } catch (error: any) {
    console.error(`Session manager error: ${error.message}`);
    process.exit(1);
  }
}

main();