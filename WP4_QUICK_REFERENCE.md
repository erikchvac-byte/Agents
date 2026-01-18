# WP4 Quick Reference Card

## For Local Agents: What You Need to Do

### The 4-Step Mission
1. **ANALYZE** - Read 19 agent files, extract method signatures → `WP4_AGENT_SIGNATURES.md`
2. **DEFINE** - Create 18 MCP tools with schemas → `mcp-server/tools.ts`
3. **FIX** - Update agent-manager.ts with correct method calls → `mcp-server/agent-manager.ts`
4. **TEST** - Run `npm run build`, confirm 0 errors → screenshot/log

### Critical Agents to Analyze
| Agent | File | Key Methods to Find |
|-------|------|-------------------|
| Router | agents/Router.ts | analyzeComplexity() |
| Critic | agents/Critic.ts | review() or reviewCode()? |
| DependencyScout | agents/DependencyScout.ts | scanDependencies() or analyzeDependencies()? |
| LogicArchivist | agents/LogicArchivist.ts | documentFile() or different? |
| SessionManager | agents/SessionManager.ts | startSession() / endSession()? |

### 10 Methods Known to Be Wrong
```
Line 114: new Critic(this.stateManager)              → Check actual constructor
Line 122: new AutoDebug(...)                         → Check actual constructor
Line 123: new LogicArchivist(...)                    → Check actual constructor
Line 166: this.critic.review(...)                    → Method doesn't exist
Line 177: this.architect.getGuidance(...)            → Method doesn't exist
Line 193: this.logicArchivist.documentFile(...)      → Method doesn't exist
Line 197: this.dependencyScout.analyzeDependencies() → Should be scanDependencies()?
Line 201: this.dataExtractor.extract(...)            → Check signature
Line 223: this.logger.getRecentActivity(...)         → Method doesn't exist
Line 52: index.ts references AGENT_TOOLS             → Not defined anywhere
```

### Success = Build Passes
```bash
npm run build
# Should output: 0 errors
```

---

## For Lead Architect: How to Review

### Quick Checklist
- [ ] All 3 files returned (signatures, tools.ts, agent-manager.ts)
- [ ] WP4_DELIVERABLES.md summarizes changes
- [ ] `npm run build` shows 0 errors
- [ ] All 18 tools in AGENT_TOOLS
- [ ] Method names match actual agent code

### If Issues Found
**Document like this:**
```
ISSUE: Line 166 - Critic.review() doesn't exist
ACTUAL METHOD: agents/Critic.ts has reviewCode()
FIX: Change line 166 to this.critic.reviewCode(...)
RETEST: npm run build
```

### Common Iterations
1. **Iteration 1:** Find wrong method names
2. **Iteration 2:** Fix constructor arguments
3. **Iteration 3:** Verify AGENT_TOOLS schemas match actual parameters
4. **Iteration 4:** Final build check (usually passes after 1-2 iterations)

---

## All 18 Tools to Define (for Local Agents)
```
1. analyze_task_complexity        (Router)
2. route_task                     (MetaCoordinator)
3. execute_simple_task            (OllamaSpecialist)
4. execute_complex_task           (ClaudeSpecialist)
5. review_code                    (Critic)
6. analyze_architecture           (Architect)
7. get_architectural_guidance     (Architect)
8. repair_code                    (RepairAgent)
9. analyze_error                  (AutoDebug)
10. document_code                 (LogicArchivist)
11. analyze_dependencies          (DependencyScout)
12. extract_data                  (DataExtractor)
13. get_performance_metrics       (PerformanceMonitor)
14. optimize_routing              (RoutingOptimizer)
15. start_session                 (SessionManager)
16. end_session                   (SessionManager)
17. get_recent_logs               (Logger)
18. ping                          (test stub)
```

---

## Files Involved

### Local Agents Read
- WP4_LOCAL_AGENT_PROMPT.md (start here!)
- WP4_INSTRUCTIONS.md (detailed reference)
- agents/*.ts (all 19 agent files)

### Local Agents Create/Update
- WP4_AGENT_SIGNATURES.md (NEW - analysis output)
- mcp-server/tools.ts (NEW - AGENT_TOOLS definition)
- mcp-server/agent-manager.ts (UPDATE - fix method calls)

### Local Agents Document
- WP4_DELIVERABLES.md (NEW - summary of changes)
- build-output.log (capture npm run build output)

### Lead Architect Uses
- WP4_REVIEW_CHECKLIST.md (to verify work)

---

## Key Insight

The agent classes **already exist** and have **real methods**.  
The code in agent-manager.ts calls **wrong method names**.  

**Your job:** Find the right names and use them.

```typescript
// WRONG - doesn't exist
this.critic.review()

// RIGHT - actually exists
this.critic.reviewCode()  // ← You find this by reading agents/Critic.ts
```

---

## Success Looks Like

### BEFORE (Broken)
```
$ npm run build

error TS2339: Property 'review' does not exist on type 'Critic'.
error TS2339: Property 'getGuidance' does not exist on type 'Architect'.
... 14 more errors ...

RESULT: ❌ FAILED
```

### AFTER (Fixed)
```
$ npm run build

(no output = success)

RESULT: ✅ PASSED
```

---

## Quick Start (Local Agents)

1. Read: **WP4_LOCAL_AGENT_PROMPT.md** (5 mins)
2. Work: **STEP 1** - Analyze agents (30 mins)
3. Work: **STEP 2** - Create tools.ts (30 mins)
4. Work: **STEP 3** - Fix agent-manager.ts (30 mins)
5. Test: **STEP 4** - Run npm run build (5 mins)
6. Return: All files + build output

**Total time: ~2 hours**

---

## Questions?

### "What method is Critic.review()?"
→ Open `agents/Critic.ts` and look for public methods

### "What parameters does this method take?"
→ Look at the method signature and JSDoc comment

### "What's the return type?"
→ Check the method signature (usually `Promise<SomethingType>`)

### "What should AGENT_TOOLS schemas include?"
→ Match what the method expects (parameters) and returns

### "How do I know if I'm done?"
→ When `npm run build` returns 0 errors

---

## One Page Workflow (for Lead Architect)

```
LOCAL AGENTS SUBMIT WORK
          ↓
You use WP4_REVIEW_CHECKLIST.md
          ↓
YES: All checks pass? → APPROVE & COMMIT
          ↓
NO: Issues found? → Document in spreadsheet/notes
          ↓
Return to local agents with feedback
          ↓
They iterate (usually 1-2 times)
          ↓
Repeat until all green ✅
```

That's it! You're ready to hand off WP4.
