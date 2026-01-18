# Prompt for Local LLM - Work Package 3

## Context

You are a local code execution agent working on implementing an MCP (Model Context Protocol) server for a multi-agent development system. You have successfully completed Work Packages 1 and 2. Now you will execute Work Package 3.

## Your Working Directory

`C:\Users\erikc\Dev\Agents`

All file paths are relative to this directory.

## Your Task

Read and execute the instructions in `WP3_INSTRUCTIONS.md` located at:
`C:\Users\erikc\Dev\Agents\WP3_INSTRUCTIONS.md`

## Critical Rules

1. **READ THE INSTRUCTIONS FIRST**: Open and read `WP3_INSTRUCTIONS.md` completely before starting
2. **FOLLOW EVERY STEP**: Execute all steps in the exact order specified
3. **CREATE FILES ON DISK**: Actually write files to the filesystem (not just describe them)
4. **RUN THE VERIFICATION SCRIPT**: Execute `verify-wp3.sh` after implementation
5. **CREATE DELIVERABLES**: Write `WP3_DELIVERABLES.md` with actual verification output
6. **STOP WHEN COMPLETE**: After creating deliverables, STOP - do not proceed to WP4

## Expected Workflow

```
1. Read WP3_INSTRUCTIONS.md
2. Replace mcp-server/agent-manager.ts with full implementation
3. Update mcp-server/index.ts to use singleton pattern
4. Create verify-wp3.sh script
5. Make verify-wp3.sh executable (chmod +x)
6. Run ./verify-wp3.sh
7. Create WP3_DELIVERABLES.md with results
8. STOP
```

## Success Criteria (ALL must be met)

- ✅ No TypeScript compilation errors (excluding node_modules and AGENT_TOOLS)
- ✅ AgentManager class implements singleton pattern
- ✅ All 19 agents imported and initialized
- ✅ executeTool method routes to all agents
- ✅ index.ts updated to use AgentManager.getInstance()
- ✅ verify-wp3.sh passes all 6 checks
- ✅ WP3_DELIVERABLES.md created with PASS status

## What Success Looks Like

When you run `./verify-wp3.sh`, you should see:

```
=== Work Package 3 Verification ===
Iteration 1 of 5
✓ All checks passed!
✓ AgentManager class is properly implemented
✓ All required agents are imported
✓ Singleton pattern is implemented
✓ index.ts updated to use singleton

==========================================
WORK PACKAGE 3 COMPLETE!
==========================================
```

## Important Notes

- The existing `mcp-server/agent-manager.ts` is a stub - REPLACE it completely
- AGENT_TOOLS errors are EXPECTED - ignore them (fixed in WP4)
- The `ping` tool in executeTool is intentional (test stub for WP3)
- Do not try to run the MCP server yet - it won't work until WP4
- Focus on TypeScript compilation and structural correctness

## When You're Done

Create `WP3_DELIVERABLES.md` and include:
1. Status (PASS or FAIL)
2. TypeScript compilation output
3. Full verification script output
4. Notes about any issues encountered

Then **STOP** and return control to the human.

---

**BEGIN EXECUTION NOW**

Read `WP3_INSTRUCTIONS.md` and start implementing Work Package 3.
