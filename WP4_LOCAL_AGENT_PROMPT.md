# WP4 - Local Agent Task Brief
**For: Local LLM Agents**  
**Complexity:** Medium  
**Time Est:** 1-2 hours  

---

## The Problem

TypeScript compilation fails with 16 errors because:
1. **Method names don't match** - The code calls `Critic.review()` but it doesn't exist
2. **Missing AGENT_TOOLS** - index.ts references a constant that was never defined
3. **Constructor mismatches** - Some agents initialized with wrong arguments

## The Solution

You need to fix 3 files by understanding what the actual agent methods are:

---

## STEP 1: Analyze 19 Agent Classes

**Read these files** and list the actual public methods in each:

### Infrastructure (3 files)
```
agents/Logger.ts
agents/SessionManager.ts
agents/Router.ts
```

### Core Agents (3 files)
```
agents/OllamaSpecialist.ts
agents/ClaudeSpecialist.ts
agents/MetaCoordinator.ts
```

### Quality Agents (3 files)
```
agents/Critic.ts
agents/Architect.ts
agents/RepairAgent.ts
```

### Support Agents (7 files)
```
agents/AutoDebug.ts
agents/LogicArchivist.ts
agents/DependencyScout.ts
agents/DataExtractor.ts
agents/PerformanceMonitor.ts
agents/RoutingOptimizer.ts
agents/Watcher.ts
```

### Output: Create `WP4_AGENT_SIGNATURES.md`

For each agent, list:
```
## AgentName
- **File:** agents/AgentName.ts
- **Constructor:** AgentName(param1: type, param2: type, ...)
- **Public Methods:**
  - methodName(param1: type, param2: type, ...): ReturnType
  - methodName2(...): ReturnType
```

**Example:**
```
## Router
- **File:** agents/Router.ts
- **Constructor:** Router(stateManager: StateManager, logger: Logger)
- **Public Methods:**
  - analyzeComplexity(task: string): Promise<ComplexityAnalysis>
  - route(task: string): Promise<RoutingDecision>
```

---

## STEP 2: Create AGENT_TOOLS Array

**Create file:** `mcp-server/tools.ts`

This file exports a constant array of all tools the MCP server exposes.

**Template:**
```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const AGENT_TOOLS: Tool[] = [
  {
    name: 'analyze_task_complexity',
    description: 'Analyzes task complexity using the Router agent',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task to analyze',
        },
      },
      required: ['task'],
    },
  },
  // Add 17 more tools here...
];
```

**Tools to document:**
1. analyze_task_complexity (from Router)
2. route_task (from MetaCoordinator)
3. execute_simple_task (from OllamaSpecialist)
4. execute_complex_task (from ClaudeSpecialist)
5. review_code (from Critic)
6. analyze_architecture (from Architect)
7. get_architectural_guidance (from Architect)
8. repair_code (from RepairAgent)
9. analyze_error (from AutoDebug)
10. document_code (from LogicArchivist)
11. analyze_dependencies (from DependencyScout)
12. extract_data (from DataExtractor)
13. get_performance_metrics (from PerformanceMonitor)
14. optimize_routing (from RoutingOptimizer)
15. start_session (from SessionManager)
16. end_session (from SessionManager)
17. get_recent_logs (from Logger)
18. ping (test stub - just echo back OK)

**Tips:**
- Look at each agent's JSDoc comments for parameter info
- Match the tool name to what makes sense (review_code vs analyzeCode, etc.)
- For parameters, use sensible types (string, number, object, etc.)

---

## STEP 3: Fix agent-manager.ts

**File:** `mcp-server/agent-manager.ts`

**Known issues to fix:**

| Line | Current Code | Issue |
|------|-------------|-------|
| 122 | `new AutoDebug(this.stateManager, this.logger)` | Check actual constructor |
| 123 | `new LogicArchivist(this.workingDir, this.stateManager)` | Check actual constructor |
| 124 | `new DependencyScout(this.workingDir)` | Check if needs more args |
| 125 | `new DataExtractor(this.stateManager)` | Check actual constructor |
| 166 | `this.critic.review(...)` | Method doesn't exist - find real name |
| 177 | `this.architect.getGuidance(...)` | Method doesn't exist - find real name |
| 193 | `this.logicArchivist.documentFile(...)` | Check real method name |
| 197 | `this.dependencyScout.analyzeDependencies()` | TypeScript suggests `scanDependencies` |
| 201 | `this.dataExtractor.extract(...)` | Check real method and params |
| 208 | `this.performanceMonitor.getMetrics()` | Check real method |
| 212 | `this.routingOptimizer.analyzePatterns()` | Check real method |
| 216 | `this.sessionManager.startSession()` | Check real method |
| 219 | `this.sessionManager.endSession()` | Check real method |
| 223 | `this.logger.getRecentActivity(...)` | Check real method |

**What to do:**
1. Use your signature analysis from Step 1
2. Update constructors to match actual signatures
3. Update method calls to use actual method names
4. Update parameters to match actual method signatures

**Example fix:**
```typescript
// OLD:
case 'analyze_dependencies':
  return await this.dependencyScout.analyzeDependencies();

// NEW (if real method is scanDependencies):
case 'analyze_dependencies':
  return await this.dependencyScout.scanDependencies();
```

---

## STEP 4: Verify It Works

Run this command:
```bash
npm run build
```

**Success:** Should complete with 0 errors
**Failure:** Will show remaining TypeScript errors - use these to iterate on Steps 1-3

---

## Deliverables

When done, provide:

1. ✅ **WP4_AGENT_SIGNATURES.md** - All 19 agents documented
2. ✅ **mcp-server/tools.ts** - AGENT_TOOLS constant created
3. ✅ **mcp-server/agent-manager.ts** - All method calls fixed
4. ✅ **Build output** - Screenshot showing `npm run build` passes
5. ✅ **WP4_CHANGES.md** - Summary of all changes made

---

## Quick Reference: Agent Files Location

All agents are in `agents/` directory:
```
agents/
  ├── Logger.ts
  ├── SessionManager.ts
  ├── Router.ts
  ├── MetaCoordinator.ts
  ├── OllamaSpecialist.ts
  ├── ClaudeSpecialist.ts
  ├── Critic.ts
  ├── Architect.ts
  ├── RepairAgent.ts
  ├── AutoDebug.ts
  ├── LogicArchivist.ts
  ├── DependencyScout.ts
  ├── DataExtractor.ts
  ├── PerformanceMonitor.ts
  ├── RoutingOptimizer.ts
  ├── Watcher.ts
  ├── index.ts
  └── [2 more agents if they exist]
```

---

## Notes

- Read JSDoc comments - they explain parameters
- Look for `async` keyword - all methods should be async/return Promise
- Constructor signatures matter - wrong args = compilation errors
- Be systematic - analyze all 19 before fixing
- Iterate if needed - test and fix until build passes
