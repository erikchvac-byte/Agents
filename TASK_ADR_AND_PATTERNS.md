# Task: Create ADR and Document Agent Interaction Patterns

## Objective
Create ADR.md with architecture decisions and document agent interaction patterns.

## Prerequisites
Read these files first:
1. `C:\Users\erikc\Dev\Agents\CLAUDE.md` (lines 17-65) - ADR format requirements
2. `C:\Users\erikc\Dev\Agents\HANDOFF.md` - Current agent documentation
3. `C:\Users\erikc\Dev\Agents\mcp-server\agent-manager.ts` - Agent initialization

## Step-by-Step Instructions

### Step 1: Create ADR.md Structure
Create `C:\Users\erikc\Dev\Agents\ADR.md` with these sections:

```markdown
# Architecture Decision Records

## Project Overview
Multi-agent development system with 16 specialized agents for automated software development.

## Core Architecture Decisions

### ADR-001: [Decision Title]
**Status**: Accepted
**Date**: 2026-01-18
**Context**: [Why was this needed?]
**Decision**: [What was chosen?]
**Rationale**: [Why this choice?]
**Consequences**: [Trade-offs, benefits, drawbacks]
**Testing**: [How was it verified?]

## Agent Interaction Patterns
[Document how agents communicate]

## Technical Constraints
[List key constraints]

## Testing Results
[Summary of test outcomes]

## Known Issues
[From review report]

## Open Questions
[Unresolved items]

## Future Considerations
[Planned improvements]

## References
[Key files and documentation]

## Change Log
[Track ADR updates]
```

### Step 2: Document Key Architecture Decisions

Create ADR entries for these decisions (find evidence in codebase):

**ADR-001: Agent Communication via StateManager**
- Read: `agents/Router.ts`, `agents/Critic.ts`, `state/StateManager.ts`
- Document: Why StateManager pattern, trade-offs, alternatives considered

**ADR-002: Dual Execution Agents (Ollama + Claude)**
- Read: `agents/OllamaSpecialist.ts`, `agents/ClaudeSpecialist.ts`, `agents/Router.ts`
- Document: Complexity-based routing, token budget, cost optimization

**ADR-003: Read-Only Agent Boundaries**
- Read: `CLAUDE.md`, agent JSDoc headers
- Document: Why agents don't write files directly, how RepairAgent handles fixes

**ADR-004: MCP Server Integration**
- Read: `mcp-server/index.ts`, `mcp-server/agent-manager.ts`, `package.json`
- Document: Why MCP, stdio transport choice, tool exposure strategy

**ADR-005: TypeScript Strict Mode**
- Read: `tsconfig.json`, `AGENTS.md`
- Document: Strict settings, benefits, impact on development

### Step 3: Document Agent Interaction Patterns

In the "Agent Interaction Patterns" section, create subsections:

#### Pattern 1: Simple Task Flow
```
User Request → Router (complexity) → MetaCoordinator (routing) → OllamaSpecialist (execute)
```
**Files to reference:**
- `agents/Router.ts` - complexity analysis
- `agents/MetaCoordinator.ts` - routing logic
- `agents/OllamaSpecialist.ts` - execution

**Document:**
- When this pattern triggers (complexity < 60)
- Data flow between agents
- StateManager role

#### Pattern 2: Complex Task Flow with Review
```
User Request → Router → MetaCoordinator → ClaudeSpecialist → Critic → [Approve/Repair]
```
**Files to reference:**
- `agents/ClaudeSpecialist.ts`
- `agents/Critic.ts`
- `agents/RepairAgent.ts`

**Document:**
- Quality gate implementation
- Review criteria
- Repair loop prevention

#### Pattern 3: MCP Tool Invocation
```
MCP Client → mcp-server/index.ts → AgentManager → Specific Agent → Result
```
**Files to reference:**
- `mcp-server/index.ts` - request handling
- `mcp-server/agent-manager.ts` - routing

**Document:**
- Tool discovery (ListTools)
- Tool execution (CallTool)
- Error handling

### Step 4: Add Technical Constraints

Document these constraints (find in code):

1. **Token Budget** - `state/TokenBudget.ts`
   - Daily limit mechanism
   - Exhaustion handling

2. **File Safety** - `utils/filePathParser.ts`
   - Blocked paths (node_modules, .git, etc.)
   - Safe path validation

3. **Agent Boundaries** - Agent JSDoc comments
   - Read-only enforcement
   - No direct file writes

4. **TypeScript Strict Mode** - `tsconfig.json`
   - All strict flags enabled
   - No unused parameters/locals

### Step 5: Add Known Issues

Copy from review report:
- **H1**: Agent count discrepancy (16 vs 19 claimed)
- **H2**: Inconsistent agent numbering
- **M1**: Unused StateManager parameters
- **M2**: LogicArchivist missing agent number

### Step 6: Add Testing Results

Summarize from test output:
- TypeScript compilation: PASS
- Jest tests: PASS (all suites)
- Coverage: Note any gaps

### Step 7: Add References Section

List key files:
```markdown
## References

### Core Documentation
- `CLAUDE.md` - Project guidelines and ADR requirements
- `AGENTS.md` - Build, test, code style guidelines
- `HANDOFF.md` - Agent descriptions and responsibilities
- `MCP_SERVER_WORK_PACKAGES.md` - MCP implementation plan

### Agent Implementations
- `agents/Router.ts` - Complexity analysis (Agent 1)
- `agents/MetaCoordinator.ts` - Task routing (Agent 14)
- `agents/OllamaSpecialist.ts` - Simple task execution
- `agents/ClaudeSpecialist.ts` - Complex task execution
- `agents/Critic.ts` - Code quality review (Agent 6)
- [List all 16 agents]

### Infrastructure
- `state/StateManager.ts` - Single source of truth
- `state/TokenBudget.ts` - Token budget tracking
- `mcp-server/index.ts` - MCP server entry point
- `mcp-server/agent-manager.ts` - Agent lifecycle management
```

### Step 8: Validation

Before completing, verify:

- [ ] ADR.md exists in project root
- [ ] At least 5 ADR entries documented
- [ ] All 3 interaction patterns documented
- [ ] Technical constraints section complete
- [ ] Known issues from review included
- [ ] References section lists all 16 agents
- [ ] File compiles if opened (no syntax errors)

## Deliverables

1. **ADR.md** - Complete architecture decision record
2. **Brief summary** - 3-5 sentences describing what was documented

## Success Criteria

- ADR.md follows format from CLAUDE.md:17-65
- Each ADR entry has all required fields (Status, Date, Context, Decision, Rationale, Consequences, Testing)
- Agent interaction patterns include file references and data flow diagrams
- Known issues from code review are documented
- File is ready for team reference without additional explanation

## Estimated Effort

- Reading reference files: 10 minutes
- Writing ADR entries: 20 minutes
- Documenting patterns: 15 minutes
- Completing other sections: 10 minutes
- **Total**: ~55 minutes

## Notes

- Keep ADR entries concise (1 paragraph per section)
- Use code references (file:line) where applicable
- Focus on "why" not "what" (code shows what, ADR explains why)
- If uncertain about a decision's rationale, note it in "Open Questions"
