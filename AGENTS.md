# AGENTS.md - Guidelines for Build, Test, and Code Style

## Scope
This document encodes conventions for building, linting, testing, and styling in this multi-agent development system repository. It aims to help agentic tooling operate safely and consistently against the project.

## Build, Lint, and Test Commands

### Primary Build Commands
- `npm run build` — Compiles TypeScript to JavaScript using `tsc` with strict settings.
- Prerequisites: Ensure `tsconfig.json` is valid and all source files compile without errors.

### Test Commands
- `npm test` — Runs full Jest test suite with TypeScript support.
- `npm run test:coverage` — Runs tests with coverage reporting (85% threshold).
- `npm run test:watch` — Runs tests in watch mode for continuous development.
- Coverage excludes: `node_modules`, `dist`, `logs` directories.

### Lint Commands
- `npm run lint` — Lints TypeScript sources using ESLint with TypeScript parser.
- `npm run lint:fix` — Auto-fixes linting issues where possible.

### Pipeline Commands
- `npm run mvp` — Runs MVP pipeline script (ts-node-based, executes core agent workflow).
- `npm run demo` — Runs full demo pipeline script (ts-node-based, comprehensive demonstration).
- `npm run session:start` — Initializes session manager for tracking agent activities.
- `npm run session:end` — Finalizes session and generates summary.

### Single Test Targeting (Critical for Debugging)
- Run specific test by name: `npm test -- -t "exact test description"`
- Run specific test file: `npm test -- path/to/your.test.ts`
- Combine file and test name: `npm test -- path/to/file.test.ts -t "specific test"`
- Coverage on single test: `npm run test:coverage -- --testNamePattern "pattern"`

## Code Style Guidelines

### General Principles
- Follow TypeScript strict best practices; prioritize readability and maintainability.
- Agents communicate via state manager, not direct calls.
- Use async/await consistently across all agent operations.

### Import Organization
- Group imports in strict order: 1) Node.js builtin modules, 2) External packages, 3) Internal modules
- Use single blank lines between groups; avoid wildcard imports.
- Prefer named imports; use relative paths for internal modules.

```typescript
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { StateManager } from '../state/StateManager';
import { Logger } from './Logger';
```

### Formatting and Syntax
- End files with a single newline; use LF line endings.
- Semicolons: Required (enforced by tooling).
- Indentation: 2 spaces (standard for TypeScript projects).
- Line length: Aim for 100 characters.

### Type System and Interfaces
- Prefer explicit types over `any`; use `unknown` for dynamic values.
- Use PascalCase for types and interfaces; employ `readonly` modifiers for immutability.
- Avoid exporting types not used outside their module.

```typescript
export interface TaskComplexity {
  readonly classification: 'simple' | 'medium' | 'complex';
  readonly score: number;
}
```

### Naming Conventions
- Variables/Functions: camelCase (e.g., `analyzeComplexity`, `filePath`)
- Classes/Interfaces/Types: PascalCase (e.g., `StateManager`, `PipelineResult`)
- Constants (shared/exported): UPPER_SNAKE_CASE (e.g., `DEFAULT_SESSION_STATE`)
- Private members: Prefix with underscore (e.g., `_workingDir`)
- Names must be descriptive and unambiguous.

### Error Handling
- Extend `Error` class for custom domain errors with actionable messages.
- Never swallow errors; always rethrow or handle with proper context.
- Use try/catch at async boundaries; preserve stack traces.

```typescript
try {
  await this.executeTask(task);
} catch (error) {
  throw new Error(`Task execution failed: ${error instanceof Error ? error.message : String(error)}`);
}
```

### Async/Await Patterns
- Use async/await exclusively; avoid Promises with `.then()/.catch()`.
- Always wrap async operations in try/catch blocks.
- Use `Promise.all()` for concurrent operations where dependencies allow.

### Testing Standards
- Tests must be deterministic, isolated, and fast (< 100ms per test).
- Mock external dependencies; use descriptive test names with `describe`/`it` blocks.
- Test both success and failure paths; cover edge cases.

```typescript
describe('Router', () => {
  it('should analyze simple task complexity correctly', async () => {
    const result = await router.analyzeComplexity('Add console.log');
    expect(result.classification).toBe('simple');
  });
});
```

### Code Quality
- Functions: Keep under 50 lines; extract helpers for complex logic.
- Prefer pure functions; minimize side effects and mutations.
- Cyclomatic complexity: Aim for < 10 per function.
- Use early returns and guard clauses to reduce nesting.

### Security and Secrets
- Never log or commit secrets, API keys, or credentials.
- Read sensitive data from environment variables (e.g., `process.env.CLAUDE_API_KEY`).
- Validate and sanitize all external inputs.

## Project Structure
- `agents/`: 19 specialized agents (Router, MetaCoordinator, OllamaSpecialist, etc.)
- `state/`: State management (StateManager, TokenBudget, schemas)
- `tests/`: Jest test suite with integration tests
- `utils/`: Shared utilities (filePathParser, verificationGates)
- `config/`: Configuration files and settings
- Root: Pipeline scripts (`run-mvp.ts`, `run-full-pipeline.ts`)

## Cursor and Copilot Rules
- **Cursor Rules**: None detected (no `.cursor/rules/` or `.cursorrules` files).
- **Copilot Instructions**: None found (no `.github/copilot-instructions.md`).

## Agent-Specific Guidelines
- **Boundaries**: Each agent operates within read-only boundaries; no direct file modifications.
- **Communication**: Agents interact solely through StateManager; no inter-agent direct calls.
- **Async Operations**: All agent methods must be async and use await patterns.
- **JSDoc**: Include comprehensive JSDoc for all agent methods describing responsibilities.
- **Error Handling**: Agents must handle errors gracefully and update state appropriately.
- **Logging**: Use Logger agent for all activity tracking and debugging.

## Quick Reference
- **Build**: `npm run build`
- **Test All**: `npm test`
- **Test Single**: `npm test -- path/to/file.test.ts -t "test name"`
- **Coverage**: `npm run test:coverage`
- **Lint**: `npm run lint` | `npm run lint:fix`
- **MVP Pipeline**: `npm run mvp`
- **Full Demo**: `npm run demo`
- **Session**: `npm run session:start` | `npm run session:end`