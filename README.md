# Agents in the OpenCode Workspace

This repository uses a small fleet of agentic tools (the "agents") to perform coding tasks within a safe, sandboxed environment. Agents can read, inspect, edit, run commands, search code, manage tasks, and fetch external information as needed. This README explains what each agent does and when to use them.

## What the agents do

- **Root Orchestrator (Code Agent)**
  - The primary agent that interprets user goals, coordinates sub-agents, and sequences work into a plan.
  - Uses a plan (todowrite) to track tasks and progress.
  - Executes commands and edits via specialized tools (read, write, edit, bash).

- **Explorer**
  - Quickly locates files and code regions using glob patterns and file-search heuristics.
  - Helpful for scoping work, understanding where to apply changes, and identifying dependencies.

- **Editor / Editor-like Tool**
  - Reads files, applies precise edits, and writes changes back to disk.
  - Supports surgical changes, preserving indentation and surrounding context.

- **Validator (Tests / Lint / Build)**
  - Runs the project's test suite, linting, and build steps to verify correctness.
  - Focuses on fast, deterministic feedback (unit tests first, then broader checks).

- **Todo/Plan Manager**
  - Manages a lightweight task list (using todowrite/todoread).
  - Breaks work into discrete steps, marks progress, and ensures a single in-progress task at a time.

- **Code/Knowledge Fetcher (Web/Search)**
  - Pulls external documentation or API references when needed (websearch, codesearch, webfetch).
  - Keeps guidance aligned with current libraries and best practices.

- **Shell Runner (Bash)**
  - Executes shell commands in the repository's working directory.
  - Used for running tests, builds, and ad-hoc tooling.
  - Sandbox and approval policies apply (see "Sandbox & Approvals").

## When and how to use them

- **Clarify your goal.** State the problem you want to solve (e.g., "add a new utility function," "fix a failing test," "optimize a slow component"). The Root Orchestrator will outline a plan.

- **Plan first.** If the task is multi-step, create a plan with Todolist:
  - Use the Todo/Plan Manager to write a short, actionable plan (1–7 steps).
  - Mark steps as in_progress/completed as you execute them.

- **Code search and discovery.**
  - Use Explorer to locate files, tests, and related modules before editing.
  - Use Codesearch/Webfetch if you need external API references or documentation.

- **Make precise changes.**
  - Use Editor to modify specific lines or blocks; keep changes minimal and well-scoped.
  - Prefer small, testable edits that unblock a test or a feature.

- **Validate locally.**
  - Run Validator checks: `npm test`, `npm run test:coverage`, and `npm run lint`.
  - If you introduce a new API or public surface, add or adjust tests accordingly.

- **Approval and sandboxing.**
  - By default, actions run under workspace-write with network sandboxing and approval on_failure.
  - For potentially destructive actions (e.g., mass file changes, dependency updates) or network calls, request explicit approval or switch to a mode with broader permissions.

- **Documentation and sharing.**
  - Update AGENTS.md or README snippets to reflect any new conventions or tooling changes.
  - When ready, summarize changes and rationale for PRs or handoffs.

## Quick-start workflows

- **Workflow A: Add a small utility**
  1. Define the goal (e.g., create `src/utils/formatDate.ts`).
  2. Explorer: locate related utilities and tests.
  3. Editor: implement the function with tests.
  4. Validator: run `npm test` and `npm run lint`.
  5. Optional: add a brief JSDoc/TSDoc comment.
  6. Todo: mark task complete.

- **Workflow B: Fix a failing test**
  1. Run tests to reproduce the failure.
  2. Explorer: open the failing test and the implicated module.
  3. Editor: implement a minimal fix; re-run tests.
  4. Validator: run full test suite and lint.
  5. If needed, add a targeted test for the edge case.

- **Workflow C: Documentation/help**
  1. Use WebFetch or WebSearch to gather relevant docs.
  2. Editor: add/adjust docs (README, AGENTS.md, inline code comments).
  3. Validator: ensure type correctness and basic build.

## Practical guidelines

- Keep edits surgical and well-justified; minimize risk to unrelated code.
- Prefer explicit types over `any`; document non-obvious decisions.
- Write descriptive test names; aim for deterministic tests.
- Do not commit secrets or large binaries; follow repository conventions.
- When in doubt, ask for clarification or propose a plan before large edits.

## Reference mappings

- `read`: read a file
- `write`: write content to a file
- `edit`: apply precise replacements in a file
- `glob`: search for files by pattern
- `grep`: search file contents
- `bash`: run shell commands
- `todowrite`: create/update plan steps
- `todoread`: read plan steps
- `websearch` / `codesearch`: fetch documentation and code examples
- `webfetch`: fetch content from URLs
- `task`: invoke specialized agents with a prompt

## Example prompts (patterns)

- "Plan to refactor the X module for readability and safety."
- "Find all usages of function `foo` in the codebase."
- "Add a unit test for the new feature Y."
- "Update README to reflect the new API surface."
- "Run tests and show failures; then propose fixes."

## Conclusion

These agents are designed to work together to get you from goal to validated change quickly and safely. Start with a clear goal, use a concise plan, and let the explorers, editors, and validators do the heavy lifting within safe sandboxing.
