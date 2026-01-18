# Work Package 4 - Agent Method Alignment & AGENT_TOOLS Definition
**Status:** Ready for Local Agent Execution  
**Date Created:** 2026-01-17  
**Objective:** Fix TypeScript errors by aligning agent-manager.ts with actual agent method signatures and create AGENT_TOOLS constant

---

## Overview

WP3 created the singleton AgentManager structure successfully, but TypeScript compilation fails because:
1. Method names in agent-manager.ts don't match actual agent class methods
2. AGENT_TOOLS constant is referenced but never defined in index.ts
3. Constructor arguments don't match actual agent initialization signatures

**Your task:** Extract real agent signatures and fix these mismatches.

---

## Task 1: Analyze Agent Signatures

### What to Do
For each of the 19 agents, determine:
1. What public methods actually exist
2. What parameters each method accepts
3. What the method returns (or returns as Promise)

### Agents to Analyze

**Infrastructure (3):**
- `agents/Logger.ts` - What methods exist? (Hint: getRecentActivity or something else?)
- `agents/SessionManager.ts` - What methods exist? (Hint: startSession/endSession methods?)
- `agents/Router.ts` - What methods exist? (Hint: analyzeComplexity?)

**Core LLM Agents (2):**
- `agents/OllamaSpecialist.ts` - What's the main execution method?
- `agents/ClaudeSpecialist.ts` - What's the main execution method?

**Coordinator (1):**
- `agents/MetaCoordinator.ts` - What methods exist?

**Quality Agents (3):**
- `agents/Critic.ts` - Does it have `review()` or different method name?
- `agents/Architect.ts` - Does it have `getGuidance()` or different method name?
- `agents/RepairAgent.ts` - What repair methods exist?

**Support Agents (7):**
- `agents/AutoDebug.ts` - What methods exist?
- `agents/LogicArchivist.ts` - Does it have `documentFile()`?
- `agents/DependencyScout.ts` - Is it `analyzeDependencies()` or `scanDependencies()`?
- `agents/DataExtractor.ts` - Does it have `extract()` method?
- `agents/PerformanceMonitor.ts` - Does it have `getMetrics()`?
- `agents/RoutingOptimizer.ts` - Does it have `analyzePatterns()`?
- `agents/Watcher.ts` - What methods exist?

### Output Format

Create a file `WP4_AGENT_SIGNATURES.md` with this structure:

```markdown
# Agent Method Signatures

## Logger
- **Methods:** 
  - `method1(param1: type) -> return type`
  - `method2(param2: type) -> return type`
- **Note:** Any important details

## SessionManager
- **Methods:**
  - ...
```

---

## Task 2: Create AGENT_TOOLS Constant

### What to Do
Based on your signature analysis, create the AGENT_TOOLS array that:
1. Maps each agent method to an MCP tool
2. Includes tool descriptions
3. Specifies input/output schemas

### Template Structure

```typescript
const AGENT_TOOLS: Tool[] = [
  {
    name: 'tool_name_here',
    description: 'What this tool does',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'What param1 does' },
        param2: { type: 'number', description: 'What param2 does' },
      },
      required: ['param1'],
    },
  },
  // ... more tools
];
```

### Tools to Document
1. From **Router**: `analyze_task_complexity`
2. From **MetaCoordinator**: `route_task`
3. From **OllamaSpecialist**: `execute_simple_task`
4. From **ClaudeSpecialist**: `execute_complex_task`
5. From **Critic**: `review_code`
6. From **Architect**: `analyze_architecture`, `get_architectural_guidance`
7. From **RepairAgent**: `repair_code`
8. From **AutoDebug**: `analyze_error`
9. From **LogicArchivist**: `document_code`
10. From **DependencyScout**: `analyze_dependencies`
11. From **DataExtractor**: `extract_data`
12. From **PerformanceMonitor**: `get_performance_metrics`
13. From **RoutingOptimizer**: `optimize_routing`
14. From **SessionManager**: `start_session`, `end_session`
15. From **Logger**: `get_recent_logs`
16. Test stub: `ping`

### Output File
Create `mcp-server/tools.ts` with the AGENT_TOOLS constant.

---

## Task 3: Update agent-manager.ts

### Known Issues to Fix

| Tool Name | Current Code | Issue |
|-----------|------------|-------|
| `review_code` | `this.critic.review(...)` | Method doesn't exist on Critic |
| `get_architectural_guidance` | `this.architect.getGuidance(...)` | Method doesn't exist on Architect |
| `document_code` | `this.logicArchivist.documentFile(...)` | Check actual method name |
| `analyze_dependencies` | `this.dependencyScout.analyzeDependencies()` | Might be `scanDependencies()` |
| `extract_data` | `this.dataExtractor.extract(...)` | Check signature |
| `get_performance_metrics` | `this.performanceMonitor.getMetrics()` | Check actual method |
| `optimize_routing` | `this.routingOptimizer.analyzePatterns()` | Check actual method |
| `start_session` | `this.sessionManager.startSession()` | Check actual method |
| `end_session` | `this.sessionManager.endSession()` | Check actual method |
| `get_recent_logs` | `this.logger.getRecentActivity(...)` | Check actual method |

### What to Do
1. Cross-reference your signature analysis
2. Update method names to match actual implementations
3. Adjust parameters to match actual signatures
4. Create a detailed report of all changes made

### Output File
Updated `mcp-server/agent-manager.ts` with all method calls corrected.

---

## Task 4: Compilation & Validation

### What to Do
1. Run `npm run build` to compile TypeScript
2. Document any remaining errors
3. If errors exist, iterate on Tasks 1-3
4. Verify no TypeScript errors remain

### Success Criteria
- `npm run build` completes with 0 errors
- All 18 agent tools callable via agent-manager.executeTool()
- AGENT_TOOLS constant properly imported in index.ts

---

## Deliverables for Local Agents to Produce

1. **WP4_AGENT_SIGNATURES.md** - Complete mapping of all 19 agent methods
2. **mcp-server/tools.ts** - AGENT_TOOLS constant with proper schemas
3. **mcp-server/agent-manager.ts** - Updated with correct method calls
4. **WP4_CHANGES.md** - Summary of all changes and decisions made
5. **Build verification** - Screenshot or output showing `npm run build` passes

---

## Reference: Current Error Messages

```
mcp-server/agent-manager.ts(166,34): error TS2339: Property 'review' does not exist on type 'Critic'
mcp-server/agent-manager.ts(177,37): error TS2339: Property 'getGuidance' does not exist on type 'Architect'
mcp-server/agent-manager.ts(193,42): error TS2339: Property 'documentFile' does not exist on type 'LogicArchivist'
mcp-server/agent-manager.ts(197,43): error TS2551: Property 'analyzeDependencies' does not exist on type 'DependencyScout'. Did you mean 'scanDependencies'?
mcp-server/agent-manager.ts(201,41): error TS2339: Property 'extract' does not exist on type 'DataExtractor'
mcp-server/agent-manager.ts(208,46): error TS2339: Property 'getMetrics' does not exist on type 'PerformanceMonitor'
mcp-server/agent-manager.ts(212,44): error TS2339: Property 'analyzePatterns' does not exist on type 'RoutingOptimizer'
mcp-server/agent-manager.ts(216,42): error TS2339: Property 'startSession' does not exist on type 'SessionManager'
mcp-server/agent-manager.ts(219,42): error TS2339: Property 'endSession' does not exist on type 'SessionManager'
mcp-server/agent-manager.ts(223,34): error TS2339: Property 'getRecentActivity' does not exist on type 'Logger'
```

---

## How to Submit Work

When complete, create:
- **WP4_DELIVERABLES.md** with status, all changes, and verification results
- Commit changes with message: "WP4: Agent method alignment and AGENT_TOOLS definition"
- Return output files and status to lead architect for verification

---

## Questions?

- Focus on Tasks 1-2 first (analysis)
- Tasks 3-4 will follow naturally once signatures are clear
- Iterate on any ambiguous method names by checking JSDoc comments
