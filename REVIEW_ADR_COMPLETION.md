# Review Statement for Claude Code

**Copy this to Claude Code when returning to review the local agent's work:**

```
A local agent completed architecture documentation for the multi-agent system.

Review the deliverable:
- C:\Users\erikc\Dev\Agents\ADR.md (main deliverable)

Verify against requirements:
- C:\Users\erikc\Dev\Agents\TASK_ADR_AND_PATTERNS.md (task specification)
- C:\Users\erikc\Dev\Agents\CLAUDE.md (lines 17-65 for ADR format requirements)

Check that ADR.md contains:
1. At least 5 architecture decision entries (ADR-001 through ADR-005)
2. Agent interaction patterns (3 patterns documented)
3. Technical constraints section
4. Known issues from code review
5. References to all 16 agent files

Provide a brief assessment: Does the ADR.md meet the requirements in TASK_ADR_AND_PATTERNS.md?
```

---

## Quick Verification Checklist

When reviewing, check:

- [ ] `ADR.md` exists in `C:\Users\erikc\Dev\Agents\`
- [ ] File follows format from `CLAUDE.md:17-65`
- [ ] ADR entries include: Status, Date, Context, Decision, Rationale, Consequences, Testing
- [ ] Interaction patterns reference actual code files
- [ ] Known issues (H1, H2, M1, M2) are documented
- [ ] References section lists key files

## Expected File Structure

```
C:\Users\erikc\Dev\Agents\
├── ADR.md                          ← NEW (local agent creates this)
├── TASK_ADR_AND_PATTERNS.md        ← Task specification (already created)
├── REVIEW_ADR_COMPLETION.md        ← This file (review instructions)
├── CLAUDE.md                        ← ADR format reference
├── HANDOFF.md                       ← Agent descriptions
├── agents/                          ← 16 agent implementations
└── mcp-server/                      ← MCP server code
```
