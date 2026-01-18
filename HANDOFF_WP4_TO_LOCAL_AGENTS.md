# WP4 HANDOFF - Local Agent Execution Package
**From:** Lead Architect (Claude)  
**To:** Local LLM Agents  
**Date:** 2026-01-17  
**Status:** Ready for Execution

---

## Quick Start

You have been given **WP4 (Work Package 4)** to complete. Here are your resources:

### 📋 Your Task Documents (Read These First)
1. **WP4_LOCAL_AGENT_PROMPT.md** ← START HERE (simplified, step-by-step)
2. **WP4_INSTRUCTIONS.md** (detailed technical reference)

### 🔍 Review Criteria (For Lead Architect)
3. **WP4_REVIEW_CHECKLIST.md** (how your work will be verified)

---

## What You're Doing

**Objective:** Fix TypeScript compilation errors by aligning code with actual agent methods

**Current Status:** 16 TypeScript errors, cannot compile

**Your Goal:** 0 TypeScript errors, code compiles successfully

**Complexity:** Medium  
**Estimated Time:** 1-2 hours  
**Deliverables:** 3 files + verification

---

## Quick Summary of Work

### STEP 1: Analyze (30 mins)
Read 19 agent files, extract:
- Constructor signatures
- Public method names
- Method parameters and return types

**Output:** `WP4_AGENT_SIGNATURES.md`

### STEP 2: Define Tools (30 mins)
Create MCP tools array with proper schemas for all 18 tools

**Output:** `mcp-server/tools.ts`

### STEP 3: Fix Code (30 mins)
Update agent-manager.ts with correct method names and parameters

**Output:** Updated `mcp-server/agent-manager.ts`

### STEP 4: Verify (15 mins)
Run `npm run build` and ensure 0 errors

**Output:** Build success screenshot/log

---

## Key Challenges You'll Face

### ❌ Problem 1: Method Name Mismatches
**Error:** `Property 'review' does not exist on type 'Critic'`  
**Solution:** Find the actual method name in agents/Critic.ts (might be `reviewCode()` or something else)

### ❌ Problem 2: Constructor Arguments Wrong
**Error:** `Expected 0 arguments, but got 2`  
**Solution:** Check actual constructor signature and match it exactly

### ❌ Problem 3: Missing Constant
**Error:** `Cannot find name 'AGENT_TOOLS'`  
**Solution:** Create mcp-server/tools.ts with AGENT_TOOLS export

### ❌ Problem 4: Parameter Type Mismatches
**Error:** Method expects different parameter count or types  
**Solution:** Match agent-manager.ts calls to actual method signatures

---

## Critical Files to Read

### Agents (analyze these 19)
```
agents/Logger.ts
agents/SessionManager.ts
agents/Router.ts
agents/MetaCoordinator.ts
agents/OllamaSpecialist.ts
agents/ClaudeSpecialist.ts
agents/Critic.ts
agents/Architect.ts
agents/RepairAgent.ts
agents/AutoDebug.ts
agents/LogicArchivist.ts
agents/DependencyScout.ts
agents/DataExtractor.ts
agents/PerformanceMonitor.ts
agents/RoutingOptimizer.ts
agents/Watcher.ts
(+ 3 more if they exist in agents/index.ts)
```

### Code to Fix
```
mcp-server/agent-manager.ts (lines 82-127, 143-231)
mcp-server/index.ts (add import for AGENT_TOOLS)
```

### Create New File
```
mcp-server/tools.ts (define AGENT_TOOLS constant)
```

---

## Success Criteria

✅ **PASS:** When you complete these:

1. All 3 output files created/updated
2. `npm run build` returns 0 errors
3. All 18 tools are callable via agentManager.executeTool()
4. No TypeScript compilation warnings related to agent-manager.ts

❌ **FAIL:** If any of these are true:

1. Files missing or incomplete
2. `npm run build` has errors
3. Method names still don't match actual agents
4. AGENT_TOOLS constant not properly exported

---

## How to Submit Work

When complete:

1. Create **WP4_DELIVERABLES.md** with:
   - List of all changes made
   - Justification for method name choices
   - Build verification screenshot
   - Any challenges encountered

2. Commit with message:
   ```
   git add .
   git commit -m "WP4: Agent method alignment and AGENT_TOOLS definition"
   ```

3. Report status with:
   - All files created/updated
   - Build output (0 errors)
   - Any issues you couldn't resolve

---

## Common Patterns to Look For

When analyzing agents, look for these patterns:

**In constructor:**
```typescript
constructor(stateManager: StateManager, logger: Logger) { ... }
```

**Public async methods:**
```typescript
async analyzeComplexity(task: string): Promise<ComplexityResult> { ... }
async reviewCode(code: string, path: string): Promise<Review> { ... }
async scanDependencies(): Promise<DependencyMap> { ... }
```

**Return types:** Nearly all methods return `Promise<SomeType>`

**Parameters:** Usually small number (1-3 parameters)

---

## Iteration Process

If you get stuck:

1. **Re-read agent file** for the exact method signature
2. **Check JSDoc comments** for parameter descriptions
3. **Look at constructor** to understand what the agent needs
4. **Compare to working agents** in the same category

If still stuck:
- Make your best guess with clear documentation
- Document the uncertainty in WP4_DELIVERABLES.md
- Lead architect will review and iterate if needed

---

## Files You'll Reference While Working

| File | Purpose |
|------|---------|
| WP4_LOCAL_AGENT_PROMPT.md | Your step-by-step guide |
| WP4_INSTRUCTIONS.md | Detailed requirements |
| agents/*.ts (19 files) | The agents you're analyzing |
| mcp-server/agent-manager.ts | Code to fix |
| mcp-server/index.ts | Where AGENT_TOOLS is imported |

---

## Example: How This Works

### BEFORE (Broken)
```typescript
// agent-manager.ts line 166
case 'review_code':
  return await this.critic.review(code, filePath, task);  // ❌ Method doesn't exist
```

### STEP 1: Find Real Method
```typescript
// agents/Critic.ts
async reviewCode(code: string, filePath: string, taskContext: string): Promise<CodeReview> {
  // actual implementation
}
```

### STEP 2: Fix Code
```typescript
// agent-manager.ts line 166
case 'review_code':
  return await this.critic.reviewCode(code, filePath, task);  // ✅ Correct method name
```

### STEP 3: Define Tool
```typescript
// mcp-server/tools.ts
{
  name: 'review_code',
  description: 'Reviews code using the Critic agent',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to review' },
      filePath: { type: 'string', description: 'File path' },
      task: { type: 'string', description: 'Task context' },
    },
    required: ['code', 'filePath', 'task'],
  },
}
```

---

## You're Ready!

Start with **WP4_LOCAL_AGENT_PROMPT.md** and follow the 4 steps.

Good luck! 🚀

---

## Questions During Execution?

If you encounter ambiguity:

1. **Check JSDoc comments** in the agent file
2. **Look at how it's constructed** in agent-manager.ts initialize()
3. **Compare similar agents** for patterns
4. **Make reasonable assumptions** and document them
5. **Lead architect will review** and iterate if needed

The goal is to get it compiling. Perfect accuracy will be validated in testing.
