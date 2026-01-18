# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-18

### Added
- **Type Safety Synchronization**: Centralized all type definitions in `state/schemas.ts` as single source of truth
- 6 new interfaces in `state/schemas.ts`: `CodeReview`, `CodeIssue`, `SecurityConcern`, `PerformanceIssue`, `CodeDiff`, `ComplexityAnalysis`
- Explicit JSON Schema properties for `repair_code` tool (7 properties mirroring `CodeReview` interface)
- Explicit JSON Schema properties for `end_session` tool (7 properties mirroring `SessionSummary` interface)
- Enum constraints to `route_task` tool: `complexity` ('simple'|'complex'), `forceAgent` ('ollama-specialist'|'claude-specialist')
- **ADR-006**: Architecture decision record for MCP Schema Type Safety Synchronization

### Changed
- **MCP Tool Schemas**: Expanded from generic `type: 'object'` to explicit property definitions (1:1 mapping with TypeScript interfaces)
- Updated imports in `agents/Critic.ts` to use centralized schemas from `state/schemas.ts`
- Updated imports in `agents/Router.ts` to use `ComplexityAnalysis` from centralized schemas
- Updated imports in `agents/RepairAgent.ts` to use centralized schemas

### Fixed
- **All Tests Passing**: Fixed remaining 14 test failures (Logger queryLogs filtering issues) - now 139/139 tests passing ✅
- Eliminated circular import risks (removed `Critic` → `RepairAgent` dependency)
- Prevented runtime errors from LLMs calling MCP tools without required fields

### Improved
- **Type Safety**: Both compile-time (TypeScript) and runtime (MCP) validation now active
- **Maintainability**: Single source of truth for all type definitions reduces duplication
- **API Contracts**: Clear, explicit contracts for all MCP tool parameters

## [1.0.0] - 2026-01-07

### Added
- Initial release with all 19 agents implemented
- **Core Routing Agents** (4): Router, MetaCoordinator, OllamaSpecialist, ClaudeSpecialist
- **Quality Assurance Agents** (4): Critic, Architect, RepairAgent, AutoDebug
- **Documentation & Analysis Agents** (3): LogicArchivist, DependencyScout, DataExtractor
- **Monitoring & Optimization Agents** (3): PerformanceMonitor, RoutingOptimizer, Watcher
- **Infrastructure Agents** (5): SessionManager, Logger, StateManager, TokenBudget, Ping
- Automated code repair system (RepairAgent) with 7 pattern-based fixes
- Three-verdict code review system (approved/needs_repair/rejected)
- Automatic file writing with atomic operations
- Natural language file path parsing
- MCP server integration with stdio transport
- VS Code/Claude Code Task tool integration
- Zero-cost execution model (Ollama MCP + Task tool)

### Security
- File safety controls (blocks dangerous paths, validates working directory)
- Token budget management (100,000 daily limit)
- Read-only agent boundaries (only execution agents can write files)
- Critic review required before file writes

### Testing
- 139 total tests across 9 test suites
- 85% code coverage threshold
- TypeScript strict mode compliance
- Integration tests for end-to-end pipeline workflow

---

## Release Notes

### Version 1.0.1 - Type Safety & Quality
This release focuses on **type safety improvements** and **test quality**:
- ✅ **139/139 tests passing** (100% pass rate)
- ✅ **1:1 type mapping** between MCP schemas and TypeScript interfaces
- ✅ **Zero TypeScript errors** in strict mode
- ✅ **Centralized type definitions** for easier maintenance

**Breaking Changes**: None - all changes are additive and clarifying

**Migration Guide**: No migration needed - existing code continues to work

### Version 1.0.0 - Initial Release
Complete 19-agent multi-agent software development system with:
- Intelligent task routing based on complexity analysis
- Automated code generation and repair
- Quality gates with security scanning
- Zero-cost execution via Ollama MCP and VS Code Task tool
- Production-ready TypeScript with strict mode

---

## Links
- **Repository**: https://github.com/erikchvac-byte/Agents
- **Documentation**: See HANDOFF.md, ADR.md, README.md
- **Architecture**: See VSCODE_INTEGRATION_ARCHITECTURE.md
- **Guidelines**: See AGENTS.md

## Support
For issues, questions, or contributions, please refer to the repository documentation.
