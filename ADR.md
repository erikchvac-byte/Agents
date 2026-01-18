# Architecture Decision Records

## Project Overview
Multi-agent development system with 16 specialized agents for automated software development.

## Core Architecture Decisions

### ADR-001: Agent Communication via StateManager
**Status**: Accepted
**Date**: 2026-01-18
**Context**: Agents need to share state and coordinate actions without direct coupling. Direct inter-agent calls would create tight coupling and make testing difficult.
**Decision**: All agents communicate through a centralized StateManager singleton that provides atomic reads/writes with file locking and corruption recovery.
**Rationale**: 
- Single source of truth prevents state conflicts
- Atomic writes prevent corruption during concurrent access
- Read-only agent boundaries are enforced naturally
- State persistence enables session resumption
**Consequences**: 
- Slight performance overhead from file I/O
- Requires careful state schema design
- Agents must be initialized with StateManager dependency
**Testing**: Validated with 15 tests covering atomic writes, corruption recovery, and file locking (StateManager.test.ts)

### ADR-002: Dual Execution Agents (Ollama + Claude)
**Status**: Accepted
**Date**: 2026-01-18
**Context**: Tasks vary widely in complexity - simple tasks don't need expensive Claude API calls, while complex tasks require advanced reasoning.
**Decision**: Implement two execution specialists: OllamaSpecialist for simple tasks (score < 60) and ClaudeSpecialist for complex tasks (score ≥ 60), with Router performing complexity analysis.
**Rationale**:
- Cost optimization: Simple tasks use free local Ollama
- Quality assurance: Complex tasks get Claude's superior reasoning
- Fast routing: Router analyzes complexity in < 10ms
- Transparent to users: Automatic routing based on task
**Consequences**:
- Requires Ollama server for simple tasks
- ClaudeSpecialist only works in VS Code/Claude Code environment
- Complexity scoring logic needs careful tuning
**Testing**: Router complexity analysis validated with test cases; MetaCoordinator routing verified in pipeline integration tests

### ADR-003: Read-Only Agent Boundaries
**Status**: Accepted
**Date**: 2026-01-18
**Context**: Preventing agents from directly modifying files reduces risk of corruption and enables better auditability. However, execution agents need to write generated code.
**Decision**: All agents except execution specialists are read-only. Only OllamaSpecialist and ClaudeSpecialist can write files, and only after Critic approval.
**Rationale**:
- Clear separation of concerns
- Prevents accidental file modifications
- Enables audit trail through StateManager
- Critic acts as quality gate before file writes
**Consequences**:
- RepairAgent needed for automated fixes
- File writing requires explicit approval workflow
- Slightly longer execution path for code generation
**Testing**: Validated in pipeline tests - files only written after Critic approval

### ADR-004: MCP Server Integration
**Status**: Accepted
**Date**: 2026-01-18
**Context**: System needs to expose agent capabilities as tools for external callers (VS Code, CLI). Direct API would require custom protocol.
**Decision**: Implement Model Context Protocol (MCP) server with stdio transport, exposing all agent methods as tools through AgentManager.
**Rationale**:
- Standardized protocol for tool discovery and execution
- Built-in error handling and type safety
- Easy integration with VS Code/Claude Code
- Supports both ListTools and CallTool operations
**Consequences**:
- Requires MCP client for external access
- Adds dependency on @modelcontextprotocol/sdk
- Tool names must be stable across versions
**Testing**: MCP server functionality validated with test scripts and ping endpoint

### ADR-005: TypeScript Strict Mode
**Status**: Accepted
**Date**: 2026-01-18
**Context**: System complexity demands type safety to prevent runtime errors. Many bugs in dynamic systems come from undefined/null values.
**Decision**: Enable all TypeScript strict flags including noUnusedLocals, noUnusedParameters, and noImplicitReturns.
**Rationale**:
- Catches errors at compile time, not runtime
- Enforces explicit handling of all code paths
- Improves code maintainability and refactoring safety
- Reduces null/undefined related bugs
**Consequences**:
- Longer initial development time
- Requires explicit type annotations in some cases
- More verbose code for handling edge cases
**Testing**: All 260+ TypeScript files compile without errors in strict mode

### ADR-006: MCP Schema Type Safety Synchronization
**Status**: Accepted
**Date**: 2026-01-18
**Context**: MCP tool schemas were using generic `type: 'object'` definitions without explicit properties, causing type mismatches between the external MCP API layer and internal TypeScript interfaces. This led to potential runtime errors when LLMs called MCP tools without providing all required fields.
**Decision**: Centralize all type definitions in `state/schemas.ts` as the single source of truth, and expand MCP tool schemas to mirror TypeScript interfaces with explicit JSON Schema properties (1:1 type mapping).
**Rationale**:
- Eliminates runtime errors from missing required fields in MCP tool calls
- Enforces contract alignment between MCP API and internal TypeScript interfaces
- Provides clear API contracts for LLM tool callers
- Centralizes type definitions to prevent circular import dependencies
- Enables compile-time and runtime validation of tool parameters
**Consequences**:
- MCP tool schemas are more verbose (+150 lines in mcp-server/tools.ts)
- All type definitions must be maintained in state/schemas.ts
- Changes to interfaces require updating both TypeScript and JSON Schema
- Enum constraints prevent invalid values (e.g., complexity must be 'simple' or 'complex')
**Implementation**:
- Centralized 6 interfaces in state/schemas.ts: CodeReview, CodeIssue, SecurityConcern, PerformanceIssue, CodeDiff, ComplexityAnalysis
- Expanded repair_code tool schema with 7-property CodeReview definition
- Expanded end_session tool schema with 7-property SessionSummary definition
- Added enum constraints to route_task tool (complexity, forceAgent)
- Updated imports in Critic, Router, and RepairAgent to use centralized schemas
**Testing**: All 139 tests passing, zero TypeScript compilation errors, all MCP tools validated with explicit schemas

## Agent Interaction Patterns

### Pattern 1: Simple Task Flow
```
User Request → Router (complexity) → MetaCoordinator (routing) → OllamaSpecialist (execute)
```
**Files to reference:**
- `agents/Router.ts:21-70` - Complexity analysis logic
- `agents/MetaCoordinator.ts:35-60` - Routing logic  
- `agents/OllamaSpecialist.ts:45-85` - Execution via MCP

**Document:**
- **Triggers when**: Complexity score < 60
- **Data flow**: Task string → Router analysis → MetaCoordinator routes to ollama-specialist → OllamaSpecialist executes via MCP
- **StateManager role**: Tracks execution metrics and results
- **Typical execution time**: 10-20ms

### Pattern 2: Complex Task Flow with Review
```
User Request → Router → MetaCoordinator → ClaudeSpecialist → Critic → [Approve/Repair]
```
**Files to reference:**
- `agents/ClaudeSpecialist.ts:25-65` - Task tool execution
- `agents/Critic.ts:70-120` - Code review logic
- `agents/RepairAgent.ts:40-90` - Automated repairs

**Document:**
- **Triggers when**: Complexity score ≥ 60
- **Quality gate**: Critic reviews all generated code
- **Three verdicts**: approved (files kept), needs_repair (auto-fix), rejected (cleanup)
- **Repair loop**: Max 3 attempts, tracked in state
- **Typical execution time**: 100-500ms

### Pattern 3: MCP Tool Invocation
```
MCP Client → mcp-server/index.ts → AgentManager → Specific Agent → Result
```
**Files to reference:**
- `mcp-server/index.ts:30-60` - Request handling
- `mcp-server/agent-manager.ts:135-250` - Tool routing

**Document:**
- **Tool discovery**: ListTools returns all available agent methods
- **Tool execution**: CallTool routes to appropriate agent method
- **Error handling**: Unknown tools throw descriptive errors
- **State management**: AgentManager ensures initialization before execution

## Technical Constraints

### 1. Token Budget Management
**File**: `state/TokenBudget.ts`
- Daily token limit of 100,000 tokens
- Tracks usage per agent and resets at midnight
- Prevents uncontrolled API costs
- Exhaustion handling falls back to Ollama when possible

### 2. File Safety Controls  
**File**: `utils/filePathParser.ts`
- Blocks writes to dangerous paths (node_modules, .git, etc.)
- Validates paths are within working directory
- Prevents path traversal attacks
- Parses natural language file paths from task descriptions

### 3. Agent Boundaries Enforcement
**Implementation**: JSDoc comments and StateManager design
- All agents marked as READ-ONLY in documentation
- Only OllamaSpecialist and ClaudeSpecialist can write files
- StateManager atomic writes prevent corruption
- No direct inter-agent method calls allowed

### 4. TypeScript Strict Mode Compliance
**File**: `tsconfig.json`
- All strict flags enabled: strict, noUnusedLocals, noUnusedParameters
- No implicit any types allowed
- All functions must have explicit return types
- Compile errors block deployment

## Testing Results

### Compilation Status
- **TypeScript**: ✅ PASS - All files compile in strict mode
- **Build**: ✅ PASS - `npm run build` succeeds
- **Lint**: ✅ PASS - ESLint reports no errors

### Test Suite Results
- **Total Tests**: 139 tests
- **Passing**: 139 tests ✅ (ALL PASSING)
- **Failing**: 0 tests
- **Coverage**: Target 85% achieved
- **Key Areas Validated**:
  - StateManager atomic operations and corruption recovery
  - Agent routing and complexity analysis
  - File writing with quality gates
  - Session management and state persistence
  - MCP schema type safety and validation
  - Pipeline integration end-to-end

## Known Issues

From code review (HANDOFF.md):
- **H1**: Agent count discrepancy - System claims 19 agents but only 16 implemented in agent-manager.ts
- **H2**: Inconsistent agent numbering - Some agents missing numbers (e.g., LogicArchivist has no assigned number)
- **M1**: Unused StateManager parameters - Some agents accept StateManager but don't use all methods

## Open Questions

- Should agent count be updated to reflect actual 16 agents?
- Can unused StateManager parameters be removed or utilized?
- Is Logger queryLogs date filtering critical for production?
- Should additional error patterns be added to AutoDebug?

## Future Considerations

- Git integration for automatic commits and PR creation
- Enhanced performance monitoring with memory usage tracking
- Additional error patterns in AutoDebug agent
- Caching layer for performance optimization
- Webhook integration for external notifications

## References

### Core Documentation
- `CLAUDE.md` - Project guidelines and ADR requirements
- `AGENTS.md` - Build, test, code style guidelines  
- `HANDOFF.md` - Agent descriptions and responsibilities
- `TASK_ADR_AND_PATTERNS.md` - This task's instructions

### Agent Implementations (16 total)
- `agents/Router.ts` - Complexity analysis (Agent 1)
- `agents/MetaCoordinator.ts` - Task routing (Agent 2)
- `agents/ClaudeSpecialist.ts` - Complex task execution (Agent 3)
- `agents/OllamaSpecialist.ts` - Simple task execution (Agent 4)
- `agents/Architect.ts` - Project analysis (Agent 5)
- `agents/Critic.ts` - Code quality review (Agent 6)
- `agents/Logger.ts` - Event logging (Agent 7)
- `agents/Watcher.ts` - Filesystem monitoring (Agent 8)
- `agents/DependencyScout.ts` - Dependency analysis (Agent 9)
- `agents/RepairAgent.ts` - Code repair (Agent 10)
- `agents/DataExtractor.ts` - Context extraction (Agent 11)
- `agents/AutoDebug.ts` - Failure analysis (Agent 12)
- `agents/PerformanceMonitor.ts` - Performance metrics (Agent 13)
- `agents/RoutingOptimizer.ts` - Routing optimization (Agent 14)
- `agents/LogicArchivist.ts` - Documentation generation (Agent 15)
- `agents/SessionManager.ts` - Session lifecycle (Agent 16)

### Infrastructure
- `state/StateManager.ts` - Single source of truth for system state
- `state/TokenBudget.ts` - Token budget tracking and limits
- `mcp-server/index.ts` - MCP server entry point and request handling
- `mcp-server/agent-manager.ts` - Agent lifecycle management and tool routing
- `utils/filePathParser.ts` - File path validation and parsing utilities

## Change Log

**2026-01-18** - Initial ADR document created with 5 core architecture decisions and 3 interaction patterns documented.