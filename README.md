# Multi-Agent Development System

A 19-agent specialized system for automated software development with enforced read-only boundaries, quality gates, and MCP server integration.

## Quick Start

```bash
# Initialize a new development session
npm run session:start

# Run the MVP pipeline (simple task example)
npm run mvp

# Run full demo pipeline (complex task example)  
npm run demo

# End the current session
npm run session:end

# Start MCP server for external tool integration
npm run mcp:serve
```

## Architecture Overview

The system operates through a coordinated workflow of specialized agents:

```
User Request → Router → MetaCoordinator → Execution Agent → Quality Gate → File System
```

### Core Workflow Patterns

#### Simple Task Flow (10-20ms)
```
Task → Router (analyze) → MetaCoordinator (route) → OllamaSpecialist (execute) → Logger
```
- **Trigger:** Complexity score < 60
- **Execution:** Local Ollama LLM (free, fast)
- **Quality:** Basic validation only

#### Complex Task Flow (100-500ms)
```
Task → Router → MetaCoordinator → ClaudeSpecialist → Critic → RepairAgent → Files
```
- **Trigger:** Complexity score ≥ 60
- **Execution:** Claude Sonnet API (advanced reasoning)
- **Quality:** Code review + automated repairs

## Agent Categories

### 🎯 Core Routing (4 agents)
- **Router** - Task complexity analysis (0-100 scoring)
- **MetaCoordinator** - Intelligent task routing with token budget awareness
- **OllamaSpecialist** - Simple task execution via local LLM
- **ClaudeSpecialist** - Complex task execution via Claude API

### 🔍 Quality Assurance (4 agents)
- **Critic** - Code review for security, performance, and style
- **Architect** - Project structure analysis and guidance
- **RepairAgent** - Automated bug fixes and issue resolution
- **AutoDebug** - Failure analysis and root cause identification

### 📚 Documentation & Analysis (3 agents)
- **LogicArchivist** - Intent-focused code documentation
- **DependencyScout** - Comprehensive dependency scanning
- **DataExtractor** - Context extraction from directories

### 📊 Monitoring & Optimization (3 agents)
- **PerformanceMonitor** - System metrics and optimization reports
- **RoutingOptimizer** - ML-based routing pattern analysis
- **Watcher** - Filesystem monitoring and change detection

### 🛠️ Infrastructure (5 agents)
- **SessionManager** - Session lifecycle and persistence
- **Logger** - Comprehensive event logging and querying
- **StateManager** - Atomic state management and corruption recovery
- **TokenBudget** - API usage tracking and limits
- **Ping** - Health check and system status

## MCP Server Integration

All 19 agents are exposed as MCP tools with standardized schemas:

```bash
# Available via MCP protocol
analyze_task_complexity    # Router
route_task                 # MetaCoordinator  
execute_simple_task         # OllamaSpecialist
execute_complex_task        # ClaudeSpecialist
review_code                # Critic
analyze_architecture       # Architect
repair_code                # RepairAgent
analyze_error              # AutoDebug
document_code              # LogicArchivist
analyze_dependencies       # DependencyScout
extract_data               # DataExtractor
get_performance_metrics     # PerformanceMonitor
optimize_routing           # RoutingOptimizer
start_session              # SessionManager
end_session                # SessionManager
get_recent_logs            # Logger
ping                       # Health check
```

## Development Commands

### Pipeline Execution
```bash
npm run mvp                # Simple task demo (add sum function)
npm run demo               # Full pipeline demo
npm run session:start      # Initialize/resume development session
npm run session:end        # Finalize current session
```

### MCP Server
```bash
npm run mcp:serve          # Start MCP server on stdio
```

### Development Tools
```bash
npm run build              # TypeScript compilation
npm test                   # Run Jest test suite
npm run test:coverage      # Tests with coverage (85% threshold)
npm run test:watch         # Watch mode for development
npm run lint               # ESLint with TypeScript
npm run lint:fix           # Auto-fix linting issues
```

## Session Management

Sessions provide persistent state across development activities:

```bash
# Start a new session
npm run session:start
# Output: Session ID: 34833f47-37c5-47e1-9a61-b0a561c42b78

# View session summary
cat session_summary.json
# {
#   "session_id": "34833f47-37c5-47e1-9a61-b0a561c42b78",
#   "start_time": "2026-01-18T19:28:10.639Z",
#   "accomplished": [],
#   "incomplete_tasks": [],
#   "system_health": "healthy"
# }

# End session with statistics
npm run session:end
# Duration: 0h 0m 6s, Accomplished: 0 tasks, Health: healthy
```

## Quality Gates & Safety

### Read-Only Boundaries
- Only execution agents (Ollama/Claude) can write files
- All other agents are analysis-only
- Prevents accidental file corruption

### Code Review Process
- All complex tasks require Critic approval before file writes
- Three verdicts: **approved**, **needs_repair**, **rejected**
- Automated repair loop (max 3 attempts)

### Token Budget Management
- Daily limit: 100,000 tokens
- Per-agent tracking with automatic budget resets
- Graceful fallback to Ollama when exhausted

### File Safety Controls
- Blocks writes to dangerous paths (.git, node_modules)
- Validates paths are within working directory
- Prevents path traversal attacks

## Configuration

### OpenCode Integration (`opencode.json`)
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "multi-agent-dev-system": {
      "type": "local",
      "command": ["npm", "run", "mcp:serve"],
      "enabled": true
    }
  }
}
```

### TypeScript Strict Mode
All strict flags enabled:
- `strict` - Full type checking
- `noUnusedLocals` - No unused variables
- `noUnusedParameters` - No unused parameters
- `noImplicitReturns` - Explicit return types

## Example Workflows

### Add a Simple Feature
```bash
npm run session:start
npm run mvp  # Executes: "Add a function to sum two numbers"
npm run session:end
```
*Flow:* Router (simple) → MetaCoordinator → OllamaSpecialist → Files

### Complex Code Generation
```bash
npm run session:start  
npm run demo  # Full pipeline with quality gates
npm run session:end
```
*Flow:* Router (complex) → MetaCoordinator → ClaudeSpecialist → Critic → Files

### External Tool Integration
```bash
npm run mcp:serve  # Start server
# Connect via VS Code/Claude Code MCP client
# Access all 19 agents as tools
```

## Project Structure

```
├── agents/              # 19 specialized agents
├── state/               # State management and schemas  
├── mcp-server/          # MCP server implementation
├── utils/               # Shared utilities
├── tests/               # Jest test suite (139 tests)
├── session_summary.json # Active session metadata
└── dist/               # Compiled TypeScript output
```

## Testing & Validation

- **139 tests** covering core functionality
- **85% code coverage** threshold enforced
- **TypeScript strict mode** compilation required
- **ESLint** code quality validation

All tests pass with the current implementation, ensuring system reliability and correctness.

## Getting Help

- Use `npm run session:start` to initialize your development environment
- Check `AGENTS.md` for detailed build/test conventions
- Run `npm run demo` to see the full system in action
- Connect via MCP for external tool integration

The multi-agent system provides a safe, efficient, and quality-assured approach to automated software development.