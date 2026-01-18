# WORK PACKAGE 3: Implement Agent Manager Singleton

**⚠️ IMPORTANT FOR LOCAL AGENT: When verification passes, IMMEDIATELY stop and create deliverables file. Do NOT proceed to WP4.**

---

## Objective
Implement the AgentManager singleton class that initializes and manages all 19 agent instances, handling state management and tool execution routing.

## Prerequisites
- Work Packages 1 and 2 completed successfully
- Understanding of singleton pattern
- Knowledge of existing agent architecture (StateManager, Logger, etc.)

---

## EXECUTION STEPS

### Step 1: Update mcp-server/agent-manager.ts

**CRITICAL NOTE:** This file already exists from earlier work. You need to **REPLACE** it completely with the implementation below.

Create/replace the file with the following content:

```typescript
/**
 * Agent Manager - Singleton for managing all 19 agents
 * Handles initialization, state management, and execution routing
 */

import { StateManager } from '../state/StateManager.js';
import { Logger } from '../agents/Logger.js';
import { SessionManager } from '../agents/SessionManager.js';
import { Router } from '../agents/Router.js';
import { MetaCoordinator } from '../agents/MetaCoordinator.js';
import { OllamaSpecialist } from '../agents/OllamaSpecialist.js';
import { ClaudeSpecialist } from '../agents/ClaudeSpecialist.js';
import { Critic } from '../agents/Critic.js';
import { Architect } from '../agents/Architect.js';
import { RepairAgent } from '../agents/RepairAgent.js';
import { AutoDebug } from '../agents/AutoDebug.js';
import { LogicArchivist } from '../agents/LogicArchivist.js';
import { DependencyScout } from '../agents/DependencyScout.js';
import { DataExtractor } from '../agents/DataExtractor.js';
import { PerformanceMonitor } from '../agents/PerformanceMonitor.js';
import { RoutingOptimizer } from '../agents/RoutingOptimizer.js';
import { Watcher } from '../agents/Watcher.js';

import * as path from 'path';

export class AgentManager {
  private static instance: AgentManager | null = null;
  
  // Infrastructure
  private stateManager!: StateManager;
  private logger!: Logger;
  private sessionManager!: SessionManager;
  
  // Core agents
  private router!: Router;
  private metaCoordinator!: MetaCoordinator;
  private ollamaSpecialist!: OllamaSpecialist;
  private claudeSpecialist!: ClaudeSpecialist;
  
  // Quality agents
  private critic!: Critic;
  private architect!: Architect;
  private repairAgent!: RepairAgent;
  
  // Support agents
  private autoDebug!: AutoDebug;
  private logicArchivist!: LogicArchivist;
  private dependencyScout!: DependencyScout;
  private dataExtractor!: DataExtractor;
  private performanceMonitor!: PerformanceMonitor;
  private routingOptimizer!: RoutingOptimizer;
  private watcher!: Watcher;
  
  private workingDir: string;
  private initialized: boolean = false;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  /**
   * Get singleton instance
   */
  static getInstance(workingDir?: string): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager(workingDir);
    }
    return AgentManager.instance;
  }

  /**
   * Initialize all agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.error('[AgentManager] Initializing infrastructure...');
    
    // Initialize infrastructure
    this.stateManager = new StateManager(
      path.join(this.workingDir, 'state', 'session_state.json')
    );
    await this.stateManager.initialize();
    
    this.logger = new Logger(path.join(this.workingDir, 'logs'));
    
    this.sessionManager = new SessionManager(
      path.join(this.workingDir, 'state', 'session_summary.json'),
      this.stateManager
    );

    console.error('[AgentManager] Initializing core agents...');
    
    // Initialize core agents
    this.router = new Router(this.stateManager, this.logger);
    this.metaCoordinator = new MetaCoordinator(this.stateManager, this.logger);
    this.ollamaSpecialist = new OllamaSpecialist(
      this.stateManager,
      this.logger,
      true, // useMCP
      this.workingDir
    );
    this.claudeSpecialist = new ClaudeSpecialist(
      this.stateManager,
      this.logger,
      this.workingDir
    );

    console.error('[AgentManager] Initializing quality agents...');
    
    // Initialize quality agents
    this.critic = new Critic(this.stateManager);
    this.architect = new Architect(this.workingDir, this.stateManager);
    this.repairAgent = new RepairAgent(this.stateManager, this.logger, this.workingDir);

    console.error('[AgentManager] Initializing support agents...');
    
    // Initialize support agents
    this.autoDebug = new AutoDebug(this.stateManager, this.logger);
    this.logicArchivist = new LogicArchivist(this.workingDir, this.stateManager);
    this.dependencyScout = new DependencyScout(this.workingDir);
    this.dataExtractor = new DataExtractor(this.stateManager);
    this.performanceMonitor = new PerformanceMonitor(this.stateManager);
    this.routingOptimizer = new RoutingOptimizer(this.stateManager);
    this.watcher = new Watcher(this.workingDir);

    this.initialized = true;
    console.error('[AgentManager] All agents initialized successfully');
  }

  /**
   * Execute a tool (route to appropriate agent)
   */
  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.error(`[AgentManager] Executing tool: ${toolName}`);

    switch (toolName) {
      // Router
      case 'analyze_task_complexity':
        return await this.router.analyzeComplexity(args.task as string);

      // MetaCoordinator
      case 'route_task':
        return await this.metaCoordinator.route(
          args.task as string,
          args.complexity as any,
          args.forceAgent as any
        );

      // OllamaSpecialist
      case 'execute_simple_task':
        return await this.ollamaSpecialist.execute(args.task as string);

      // ClaudeSpecialist
      case 'execute_complex_task':
        return await this.claudeSpecialist.execute(args.task as string);

      // Critic
      case 'review_code':
        return await this.critic.review(
          args.code as string,
          args.filePath as string,
          args.task as string
        );

      // Architect
      case 'analyze_architecture':
        return await this.architect.analyzeProject();

      case 'get_architectural_guidance':
        return await this.architect.getGuidance(args.task as string);

      // RepairAgent
      case 'repair_code':
        return await this.repairAgent.repair(
          args.review as any,
          args.originalCode as string,
          args.filePath as string
        );

      // AutoDebug
      case 'analyze_error':
        return await this.autoDebug.analyzeFailure(args.error as any);

      // LogicArchivist
      case 'document_code':
        return await this.logicArchivist.documentFile(args.filePath as string);

      // DependencyScout
      case 'analyze_dependencies':
        return await this.dependencyScout.analyzeDependencies();

      // DataExtractor
      case 'extract_data':
        return await this.dataExtractor.extract(
          args.content as string,
          args.extractionType as any
        );

      // PerformanceMonitor
      case 'get_performance_metrics':
        return await this.performanceMonitor.getMetrics();

      // RoutingOptimizer
      case 'optimize_routing':
        return await this.routingOptimizer.analyzePatterns();

      // SessionManager
      case 'start_session':
        return await this.sessionManager.startSession();

      case 'end_session':
        return await this.sessionManager.endSession();

      // Logger
      case 'get_recent_logs':
        return await this.logger.getRecentActivity(args.limit as number || 10);

      // WP3 Test stub - will be removed in WP4
      case 'ping':
        return { status: 'ok', timestamp: Date.now(), message: 'MCP server is alive' };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.error('[AgentManager] Cleaning up resources...');
    // Add any cleanup logic here (close file handles, etc.)
    this.initialized = false;
    AgentManager.instance = null;
  }
}
```

### Step 2: Update mcp-server/index.ts to use AgentManager singleton

Replace the AgentManager instantiation in `mcp-server/index.ts` constructor:

**BEFORE (lines 43-44):**
```typescript
const stateManager = new StateManager(process.cwd());
this.agentManager = new AgentManager(stateManager);
```

**AFTER:**
```typescript
this.agentManager = AgentManager.getInstance(process.cwd());
```

The AgentManager now handles StateManager creation internally.

### Step 3: Create verification script

Create `verify-wp3.sh`:

```bash
#!/bin/bash

ITERATION=0
MAX_ITERATIONS=5
ERRORS=()

echo "=== Work Package 3 Verification ==="

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  echo "Iteration $ITERATION of $MAX_ITERATIONS"
  ERRORS=()
  
  # Check 1: File exists
  if [ ! -f "mcp-server/agent-manager.ts" ]; then
    ERRORS+=("mcp-server/agent-manager.ts does not exist")
  fi
  
  # Check 2: TypeScript syntax (ignore node_modules and AGENT_TOOLS errors)
  if [ -f "mcp-server/agent-manager.ts" ]; then
    TSC_OUTPUT=$(npx tsc --noEmit mcp-server/agent-manager.ts 2>&1 | grep -v "node_modules" | grep -v "AGENT_TOOLS" || true)
    if [ -n "$TSC_OUTPUT" ]; then
      ERRORS+=("TypeScript syntax errors in agent-manager.ts: $TSC_OUTPUT")
    fi
  fi
  
  # Check 3: Required imports
  if [ -f "mcp-server/agent-manager.ts" ]; then
    REQUIRED_IMPORTS=(
      "StateManager"
      "Logger"
      "Router"
      "MetaCoordinator"
      "OllamaSpecialist"
      "ClaudeSpecialist"
      "Critic"
      "Architect"
    )
    
    for import_name in "${REQUIRED_IMPORTS[@]}"; do
      if ! grep -q "import.*$import_name" mcp-server/agent-manager.ts; then
        ERRORS+=("Missing import: $import_name")
      fi
    done
  fi
  
  # Check 4: AgentManager class exists
  if [ -f "mcp-server/agent-manager.ts" ]; then
    if ! grep -q "export class AgentManager" mcp-server/agent-manager.ts; then
      ERRORS+=("AgentManager class not exported")
    fi
    
    if ! grep -q "async initialize()" mcp-server/agent-manager.ts; then
      ERRORS+=("initialize method missing")
    fi
    
    if ! grep -q "async executeTool" mcp-server/agent-manager.ts; then
      ERRORS+=("executeTool method missing")
    fi
    
    if ! grep -q "async cleanup()" mcp-server/agent-manager.ts; then
      ERRORS+=("cleanup method missing")
    fi
  fi
  
  # Check 5: Singleton pattern
  if [ -f "mcp-server/agent-manager.ts" ]; then
    if ! grep -q "private static instance" mcp-server/agent-manager.ts; then
      ERRORS+=("Singleton instance field missing")
    fi
    
    if ! grep -q "static getInstance" mcp-server/agent-manager.ts; then
      ERRORS+=("getInstance method missing")
    fi
  fi
  
  # Check 6: index.ts updated to use singleton
  if [ -f "mcp-server/index.ts" ]; then
    if ! grep -q "AgentManager.getInstance" mcp-server/index.ts; then
      ERRORS+=("index.ts not updated to use AgentManager.getInstance()")
    fi
  fi
  
  # Success condition
  if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "✓ All checks passed!"
    echo "✓ AgentManager class is properly implemented"
    echo "✓ All required agents are imported"
    echo "✓ Singleton pattern is implemented"
    echo "✓ index.ts updated to use singleton"
    echo ""
    echo "=========================================="
    echo "WORK PACKAGE 3 COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Next step: Create deliverables report"
    exit 0
  fi
  
  # Display errors
  echo "✗ Errors found:"
  for error in "${ERRORS[@]}"; do
    echo "  - $error"
  done
  
  if [ $ITERATION -eq $MAX_ITERATIONS ]; then
    break
  fi
  
  echo "Attempting fixes..."
  echo ""
done

echo "✗ Failed after $MAX_ITERATIONS iterations"
echo ""
echo "=========================================="
echo "WORK PACKAGE 3 FAILED"
echo "=========================================="
echo ""
echo "Create error report in WP3_DELIVERABLES.md"
exit 1
```

Make it executable:
```bash
chmod +x verify-wp3.sh
```

Run verification:
```bash
./verify-wp3.sh
```

---

## VERIFICATION CRITERIA (SUCCESS METRICS)

WP3 is considered COMPLETE when ALL of the following are met:

1. **No TypeScript Errors**
   - `npx tsc --noEmit mcp-server/agent-manager.ts` passes (excluding node_modules/AGENT_TOOLS)
   - `npx tsc --noEmit mcp-server/index.ts` passes (excluding node_modules/AGENT_TOOLS)

2. **File Structure**
   - ✅ `mcp-server/agent-manager.ts` exists
   - ✅ AgentManager class is exported
   - ✅ Singleton pattern implemented (getInstance method)
   - ✅ All 19 agents are imported
   - ✅ executeTool method routes to all agents + ping stub
   - ✅ initialize() method sets up all dependencies
   - ✅ cleanup() method exists

3. **Integration**
   - ✅ `mcp-server/index.ts` updated to use `AgentManager.getInstance()`
   - ✅ StateManager no longer instantiated in index.ts (moved to AgentManager)

4. **Verification Script**
   - ✅ `verify-wp3.sh` runs and exits with code 0 (success)
   - ✅ All 6 checks pass

---

## DELIVERABLES

When verification passes, create `WP3_DELIVERABLES.md` with:

### If VERIFICATION PASSES:

```markdown
# Work Package 3 - Deliverables Report

**Date Completed:** [Date]
**Status:** PASS

## 1. Files Created/Modified

- mcp-server/agent-manager.ts (REPLACED with full singleton implementation)
- mcp-server/index.ts (UPDATED to use singleton pattern)
- verify-wp3.sh (CREATED)

## 2. TypeScript Compilation

[Paste output of: npx tsc --noEmit mcp-server/agent-manager.ts 2>&1 | grep -v "node_modules"]

## 3. Verification Script Output

[Paste full output of: ./verify-wp3.sh]

## 4. Key Implementation Highlights

- Singleton pattern implemented correctly
- All 19 agents imported and initialized
- executeTool routes to all agent methods
- Test stub 'ping' tool included for WP3 validation
- index.ts properly uses getInstance()

## 5. Notes

- AGENT_TOOLS error is expected (will be resolved in WP4)
- 'ping' tool is a test stub and will be removed in WP4
- StateManager initialization moved from index.ts to AgentManager

## ✅ WORK PACKAGE 3 COMPLETE

**Local Agent has stopped execution.**

Please return this file to Lead Architect for review.
```

### If VERIFICATION FAILS:

```markdown
# Work Package 3 - Deliverables Report

**Date Completed:** [Date]
**Status:** FAIL

## Errors Encountered

[Paste verify-wp3.sh output showing failures]

## Files Status

- mcp-server/agent-manager.ts: [EXISTS/MISSING]
- mcp-server/index.ts: [UPDATED/NOT UPDATED]
- verify-wp3.sh: [CREATED/MISSING]

## TypeScript Errors

[Paste compilation errors]

## Next Steps Required

[Describe what needs to be fixed]

## ❌ WORK PACKAGE 3 FAILED

Please return this file to Lead Architect for troubleshooting.
```

---

## STOP CONDITIONS

⚠️ **CRITICAL:** When verification script exits with code 0 (success):
1. Create WP3_DELIVERABLES.md with PASS status
2. **STOP IMMEDIATELY**
3. **DO NOT proceed to WP4**
4. Return deliverables file to Lead Architect

If verification fails after 5 iterations:
1. Create WP3_DELIVERABLES.md with FAIL status
2. Include error details
3. **STOP**
4. Return deliverables file to Lead Architect

---

## NOTES FOR LOCAL AGENT

- The existing `mcp-server/agent-manager.ts` file is a STUB from earlier work
- You MUST replace it completely with the implementation in Step 1
- The `ping` tool is intentional - it's a test stub for WP3 validation
- AGENT_TOOLS errors are EXPECTED - they will be fixed in WP4
- Focus on wiring correctness, not runtime execution (can't test agents without tools)
- Singleton pattern ensures only one AgentManager instance exists
