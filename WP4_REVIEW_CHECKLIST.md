# WP4 Review Checklist
**For: Lead Architect (You)**  
**Use this to verify local agent work before iteration**

---

## Pre-Review Checklist

- [ ] Local agents completed all 4 steps
- [ ] All 3 deliverable files exist:
  - [ ] WP4_AGENT_SIGNATURES.md
  - [ ] mcp-server/tools.ts
  - [ ] mcp-server/agent-manager.ts (updated)
- [ ] Build output provided (screenshot or log)

---

## File 1: WP4_AGENT_SIGNATURES.md

### Structure Check
- [ ] All 19 agents documented
- [ ] Each agent has: File path, Constructor, Public Methods
- [ ] Methods include parameters and return types
- [ ] Format is consistent and readable

### Content Check
**Sample verification (check 3-5 agents):**

#### Router
- [ ] Has `analyzeComplexity()` method
- [ ] Takes `task: string` parameter
- [ ] Returns Promise

#### SessionManager
- [ ] Has method to start session (name TBD)
- [ ] Has method to end session (name TBD)
- [ ] Check if constructors match agent-manager.ts calls

#### DependencyScout
- [ ] Confirm method name: `analyzeDependencies()` or `scanDependencies()`?
- [ ] Note: TypeScript suggests `scanDependencies` - verify this

#### Other agents
- [ ] Spot-check 2-3 more for accuracy

---

## File 2: mcp-server/tools.ts

### Structural Check
- [ ] File exists: `mcp-server/tools.ts`
- [ ] Exports `AGENT_TOOLS` constant
- [ ] Is array of Tool objects
- [ ] Import line: `import { Tool } from '@modelcontextprotocol/sdk/types.js';`

### Tool Count
- [ ] Exactly 18 tools defined (16 agent tools + ping stub)
- [ ] List them:
  1. [ ] analyze_task_complexity
  2. [ ] route_task
  3. [ ] execute_simple_task
  4. [ ] execute_complex_task
  5. [ ] review_code
  6. [ ] analyze_architecture
  7. [ ] get_architectural_guidance
  8. [ ] repair_code
  9. [ ] analyze_error
  10. [ ] document_code
  11. [ ] analyze_dependencies
  12. [ ] extract_data
  13. [ ] get_performance_metrics
  14. [ ] optimize_routing
  15. [ ] start_session
  16. [ ] end_session
  17. [ ] get_recent_logs
  18. [ ] ping

### Schema Check (sample 3 tools)
- [ ] `analyze_task_complexity`: 
  - Has inputSchema
  - Includes `task` property (string)
  - marked as required
- [ ] `review_code`:
  - Has inputSchema
  - Includes appropriate properties (code, filePath, etc.)
- [ ] `ping`:
  - Simple schema or empty object

### All Tools Quality
- [ ] Each tool has `name`, `description`, `inputSchema`
- [ ] Descriptions are clear and concise
- [ ] Input schemas match what agent-manager.ts expects
- [ ] No syntax errors in JSON/TypeScript

---

## File 3: agent-manager.ts

### Import Check
- [ ] Import added: `import { AGENT_TOOLS } from './tools.js';`

### Constructor Calls (lines 82-127)
Check each constructor against signatures in WP4_AGENT_SIGNATURES.md:

**Infrastructure:**
- [ ] StateManager line 82-84
- [ ] Logger line 87
- [ ] SessionManager lines 89-91

**Core Agents:**
- [ ] Router lines 97
- [ ] MetaCoordinator line 98
- [ ] OllamaSpecialist lines 99-103
- [ ] ClaudeSpecialist lines 105-108

**Quality Agents:**
- [ ] Critic line 114
- [ ] Architect line 115
- [ ] RepairAgent line 116

**Support Agents:**
- [ ] AutoDebug line 121 - **Verify parameters**
- [ ] LogicArchivist line 122 - **Verify parameters**
- [ ] DependencyScout line 123 - **Verify parameters**
- [ ] DataExtractor line 124 - **Verify parameters**
- [ ] PerformanceMonitor line 125 - **Verify parameters**
- [ ] RoutingOptimizer line 126 - **Verify parameters**
- [ ] Watcher line 127 - **Verify parameters**

### Method Calls in Switch Statement (lines 143-231)

**Critical fixes needed:**
- [ ] Line 146: `router.analyzeComplexity()` - verify correct
- [ ] Line 150-153: `metaCoordinator.route()` - verify correct
- [ ] Line 158: `ollamaSpecialist.execute()` - verify method name
- [ ] Line 162: `claudeSpecialist.execute()` - verify method name
- [ ] Line 166: `critic.review()` - **KNOWN ISSUE** - find real method
- [ ] Line 174: `architect.analyzeProject()` - verify correct
- [ ] Line 177: `architect.getGuidance()` - **KNOWN ISSUE** - find real method
- [ ] Line 181-184: `repairAgent.repair()` - verify signature
- [ ] Line 189: `autoDebug.analyzeFailure()` - verify method name
- [ ] Line 193: `logicArchivist.documentFile()` - **KNOWN ISSUE** - find real method
- [ ] Line 197: `dependencyScout.analyzeDependencies()` - **KNOWN ISSUE** - likely should be `scanDependencies()`
- [ ] Line 201-203: `dataExtractor.extract()` - **KNOWN ISSUE** - verify parameters
- [ ] Line 208: `performanceMonitor.getMetrics()` - **KNOWN ISSUE** - find real method
- [ ] Line 212: `routingOptimizer.analyzePatterns()` - **KNOWN ISSUE** - find real method
- [ ] Line 216: `sessionManager.startSession()` - **KNOWN ISSUE** - find real method
- [ ] Line 219: `sessionManager.endSession()` - **KNOWN ISSUE** - find real method
- [ ] Line 223: `logger.getRecentActivity()` - **KNOWN ISSUE** - find real method

### TypeScript Compilation

Run:
```bash
npm run build
```

Result:
- [ ] 0 TypeScript errors
- [ ] agent-manager.ts compiles without errors
- [ ] index.ts compiles without errors
- [ ] No related compilation issues in other files

---

## Verification Test

### Quick Smoke Test
If compilation passes, try:

```bash
node --eval "
import('./mcp-server/agent-manager.js').then(m => {
  const mgr = m.AgentManager.getInstance(process.cwd());
  console.log('✓ AgentManager instantiated');
  console.log('✓ executeTool method exists:', typeof mgr.executeTool === 'function');
});
"
```

Expected output:
```
✓ AgentManager instantiated
✓ executeTool method exists: true
```

---

## Common Issues & How to Flag Them

### Issue Type 1: Method Name Wrong
**Flag:** "Line X: agent.methodName() doesn't exist - should be agent.differentName()"

**What to do:** Send back to local agents with:
- Agent file reference (e.g., agents/Critic.ts:45)
- Correct method name from signatures
- Updated code snippet

### Issue Type 2: Parameter Mismatch
**Flag:** "Line X: method expects (param1, param2) but code passes (param1, param2, param3)"

**What to do:** Send back with:
- Correct parameter list
- Updated code snippet

### Issue Type 3: Constructor Wrong
**Flag:** "Line X: constructor AgentName() expects N arguments but gets M"

**What to do:** Send back with:
- All required parameters
- Type information from signature file

### Issue Type 4: Tool Schema Wrong
**Flag:** "tools.ts: Tool 'X' schema doesn't match agent-manager.ts usage"

**What to do:** Either:
- Fix schema to match usage
- Fix usage to match schema
- Get clarification from local agents on intent

---

## Sign-Off Criteria

WP4 is **COMPLETE** when:

✅ All checks above are satisfied  
✅ `npm run build` passes with 0 errors  
✅ All 3 files are present and correct  
✅ Method signatures align with actual agent code  
✅ AGENT_TOOLS properly imported in index.ts  

---

## Next Steps

Once verified:
1. Commit work: `git add . && git commit -m "WP4: Agent method alignment and AGENT_TOOLS"`
2. Create WP4_DELIVERABLES.md with summary
3. Plan WP5 (MCP server testing)

If issues found:
1. Document issues clearly
2. Return to local agents with specific line numbers and fixes needed
3. They iterate and resubmit
4. You re-verify
5. Repeat until WP4_COMPLETE
