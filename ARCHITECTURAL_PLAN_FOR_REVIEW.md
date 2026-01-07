# Multi-Agent Software Development System
## Architectural Plan for Expert Review

**Document Version:** 1.0  
**Date:** January 7, 2026  
**Status:** Awaiting Senior Engineering Review  
**System Scope:** 19 Specialized AI Agents with Enforced Read-Only Boundaries

---

## EXECUTIVE SUMMARY

This document presents an architectural plan for a multi-agent software development system designed to automate code generation, review, and quality assurance through 19 specialized AI agents. The system enforces strict read-only boundaries on analysis agents while limiting write access to only 3 execution agents, preventing scope creep and ensuring clean separation of concerns.

**Critical Design Principle:** Most agents are READ-ONLY by design, creating forcing functions that require explicit handoffs and prevent role confusion.

---

## SYSTEM OVERVIEW

### Agent Distribution
- **1 Meta-Coordinator:** Supreme oversight and routing authority
- **7 Meta-Agents:** System intelligence and optimization
- **7 Analysis Agents:** Read-only evaluation and planning
- **3 Execution Agents:** Write-enabled code generation and repair
- **1 Session Manager:** Startup/shutdown and state persistence

### Core Architecture Tenets
1. **Centralized Routing:** Meta-Coordinator makes ALL routing decisions
2. **Forcing Functions:** Read-only boundaries force clean handoffs
3. **Single Source of Truth:** session_state.json with atomic writes
4. **Circuit Breakers:** 3-strike limits with escalation to Meta-Coordinator
5. **No Next-Agent Fields:** Agents complete work, Meta-Coordinator routes

---

## AGENT SPECIFICATIONS

### TIER 1: META-COORDINATION LAYER

#### Agent 14: Meta-Coordinator (System Director)
**Type:** READ-ONLY  
**Authority Level:** Supreme Oversight

**Responsibilities:**
- Routes ALL tasks after initial Router assignment
- Monitors all 18 agents for health, performance, deadlocks
- Triggers meta-agents based on system conditions
- Enforces timeouts (5min idle → escalation)
- Handles circuit breaker trips (3 failures → intervention)
- Makes final routing decisions (to execution, repair, or approval)

**Activation Triggers:**
- System startup (health check all agents)
- Every 50 agent actions (periodic review)
- Any circuit breaker trip
- User command: "analyze system performance"
- Stale task detection (5min idle anywhere)
- Session shutdown request

**Decision Authority:**
- Can pause/resume any agent
- Can trigger any meta-agent
- Can escalate to user
- Cannot modify code directly
- Cannot override user decisions

**Critical Role:** Prevents read-only agents from making routing decisions, maintaining architectural boundaries.

---

### TIER 2: META-AGENT LAYER (SYSTEM INTELLIGENCE)

#### Agent 4: Routing-Optimizer (Decision Learner)
**Type:** READ-ONLY  
**Purpose:** Machine learning on routing effectiveness

**Responsibilities:**
- Analyzes historical routing decisions vs outcomes
- Tracks success rates: Claude vs Ollama for task types
- Proposes routing rule adjustments to Meta-Coordinator
- Monitors task complexity vs agent assignment accuracy

**Reads From:**
- session_state.json (routing history)
- failure_events.jsonl (failed routes)
- conversation_logs/ (agent performance)

**Writes To:**
- routing_recommendations.json (optimization suggestions)

**Activation:** Every 100 tasks OR weekly analysis

---

#### Agent 12: Auto-Debug (Pattern Analyzer)
**Type:** READ-ONLY  
**Purpose:** Failure pattern detection and root cause analysis

**Responsibilities:**
- Scans failure_events.jsonl for recurring patterns
- Identifies root causes: dependency conflicts, API limits, syntax patterns
- Groups related failures into clusters
- Proposes preventive measures to Meta-Coordinator

**Reads From:**
- failure_events.jsonl (all failures)
- applied_fixes.jsonl (repair history)
- conversation_logs/ (error contexts)

**Writes To:**
- debug_analysis.json (pattern reports)

**Activation:** Triggered by Meta-Coordinator when circuit breaker trips OR 5+ similar failures detected

---

#### Agent 13: Fix-Validation (Watchdog)
**Type:** READ-ONLY  
**Purpose:** Verify repairs don't introduce regressions

**Responsibilities:**
- Validates applied fixes against original failure
- Checks if fix addresses root cause vs symptom
- Detects new issues introduced by repair
- Confirms fix doesn't break existing functionality

**Reads From:**
- applied_fixes.jsonl (repair history)
- failure_events.jsonl (original failures)
- Git diffs (code changes from LinterFix)

**Writes To:**
- fix_validation_report.json (quality assessment)

**Activation:** After every LinterFix application OR Meta-Coordinator request

---

#### Agent 15: Latency-Profiler (Performance Monitor)
**Type:** READ-ONLY  
**Purpose:** Identify execution bottlenecks

**Responsibilities:**
- Tracks agent execution times vs expected baselines
- Identifies slow agents: "Architect taking 4min, should be 2min"
- Detects API latency spikes
- Proposes parallelization opportunities

**Reads From:**
- conversation_logs/ (timestamps, durations)
- session_state.json (agent handoff times)

**Writes To:**
- latency_report.json (performance metrics)

**Activation:** Every 50 tasks OR on-demand from Meta-Coordinator

---

#### Agent 16: Cost-Tracker (Budget Monitor)
**Type:** READ-ONLY  
**Purpose:** Monitor API costs and optimize spending

**Responsibilities:**
- Tracks Claude API vs Ollama usage ratios
- Flags expensive patterns: "80% Claude usage, should be 40%"
- Calculates cost per task type
- Proposes routing adjustments for budget efficiency

**Reads From:**
- conversation_logs/ (API calls, token counts)
- session_state.json (routing decisions)

**Writes To:**
- cost_analysis.json (spending reports)

**Activation:** Daily summary OR when spending exceeds threshold

---

#### Agent 17: Skill-Recommender (Capability Evolver)
**Type:** READ-ONLY  
**Purpose:** Identify missing capabilities and propose new skills

**Responsibilities:**
- Analyzes failure clusters for pattern-based skill gaps
- Proposes new skills: "5 auth failures → need oauth-patterns skill"
- Drafts skill outlines for user approval
- Tracks skill effectiveness post-implementation

**Reads From:**
- failure_events.jsonl (capability gaps)
- conversation_logs/ (recurring challenges)

**Writes To:**
- skill_proposals.json (new skill recommendations)

**Activation:** Weekly analysis OR 10+ similar failures detected

---

#### Agent 18: Deadlock-Detector (Flow Guardian)
**Type:** READ-ONLY  
**Purpose:** Prevent circular waits and infinite loops

**Responsibilities:**
- Monitors session_state.json for circular dependencies
- Detects: "Agent A waiting for B, B waiting for A"
- Identifies stuck agents (no progress in 10+ minutes)
- Auto-breaks deadlocks via timeout + escalation to Meta-Coordinator

**Reads From:**
- session_state.json (agent dependencies, wait states)
- conversation_logs/ (agent activity timestamps)

**Writes To:**
- deadlock_alerts.json (detected circular waits)

**Activation:** Continuous monitoring, checks every 2 minutes

---

### TIER 3: ANALYSIS LAYER (READ-ONLY AGENTS)

#### Agent 1: Task-Router (Complexity Analyzer)
**Type:** READ-ONLY  
**Purpose:** Initial task classification and assignment recommendation

**Responsibilities:**
- Analyzes incoming user tasks for complexity
- Classifies: simple (Ollama), complex (Claude), architecture-needed, dependency-critical
- Performs initial assessment only
- Passes recommendation to Meta-Coordinator for final routing decision

**Reads From:**
- User input
- session_state.json (current system state)

**Writes To:**
- session_state.json (complexity assessment, recommended agent)

**Does NOT:** Make final routing decision (Meta-Coordinator does this)

**Activation:** First agent called on every new task

---

#### Agent 5: Architect (Structure Scanner)
**Type:** READ-ONLY  
**Purpose:** Project structure analysis and design recommendations

**Responsibilities:**
- Scans project structure via Filesystem MCP
- Identifies: existing patterns, architectural style, dependencies
- Proposes: file locations, module boundaries, integration points
- Creates design blueprints for execution agents

**Reads From:**
- Project filesystem (via FSMCP)
- session_state.json (task requirements)

**Writes To:**
- session_state.json (architectural design, file structure plan)

**Does NOT:** Create files or modify code (execution agents do this)

**Activation:** Triggered by Meta-Coordinator for new features or structural changes

---

#### Agent 6: Critic (Logic Validator)
**Type:** READ-ONLY  
**Purpose:** Code quality review and validation

**Responsibilities:**
- Reviews execution agent output for logic errors
- Validates: correctness, edge cases, best practices
- Identifies: code smells, security issues, performance problems
- Determines: approve, request repair, or escalate

**Reads From:**
- Execution agent output (code diffs)
- session_state.json (original requirements)

**Writes To:**
- session_state.json (review verdict, issues found)

**Does NOT:** Fix code directly (routes to LinterFix or back to execution agents)

**Activation:** After every execution agent completion

---

#### Agent 7: Logger (Event Recorder)
**Type:** READ-ONLY  
**Purpose:** Comprehensive event logging and transcript management

**Responsibilities:**
- Records all agent interactions to conversation_logs/
- Maintains append-only event log
- Prunes logs older than 7 days (age-based cleanup)
- Final agent in successful task chain

**Reads From:**
- All agent outputs
- session_state.json (events to log)

**Writes To:**
- conversation_logs/ (timestamped transcripts)

**Activation:** After Critic approval OR Meta-Coordinator request

---

#### Agent 8: Watcher (Change Monitor)
**Type:** READ-ONLY  
**Purpose:** Real-time filesystem monitoring

**Responsibilities:**
- Monitors project files for external changes
- Detects: user edits, git pulls, dependency updates
- Alerts system to changes requiring re-analysis
- Tracks file modification timestamps

**Reads From:**
- Filesystem via FSMCP (file watchers)

**Writes To:**
- session_state.json (change notifications)

**Activation:** Continuous background monitoring

---

#### Agent 9: Dependency-Scout (Conflict Detector)
**Type:** READ-ONLY  
**Purpose:** Dependency analysis and conflict detection

**Responsibilities:**
- Scans package.json, requirements.txt, etc.
- Identifies: version conflicts, missing dependencies, security vulnerabilities
- Proposes: dependency resolutions, updates needed
- Checks compatibility with existing codebase

**Reads From:**
- Project dependency files via FSMCP
- session_state.json (task requirements)

**Writes To:**
- session_state.json (dependency report, conflicts found)

**Activation:** Before execution agents run OR on explicit dependency changes

---

#### Agent 10: Jira-Sync (Ticket Fetcher)
**Type:** READ-ONLY  
**Purpose:** External ticket system integration

**Responsibilities:**
- Fetches Jira tickets via Jira MCP
- Extracts: requirements, acceptance criteria, priority
- Provides context to Router for task prioritization
- Does NOT create or update tickets (read-only)

**Reads From:**
- Jira API via Jira MCP

**Writes To:**
- session_state.json (ticket context, requirements)

**Activation:** When task references Jira ticket OR periodic sync

---

### TIER 4: EXECUTION LAYER (WRITE-ENABLED AGENTS)

#### Agent 2: Ollama-Specialist (Fast Execution)
**Type:** WRITE-ENABLED  
**Purpose:** Local LLM execution for simple tasks

**Responsibilities:**
- Handles simple, well-defined tasks
- Generates code for routine implementations
- Fast turnaround, cost-efficient
- Commits code to GitHub via GitHub MCP

**Reads From:**
- session_state.json (task assignment, architectural design)

**Writes To:**
- Project files via FSMCP
- session_state.json (execution result)
- failure_events.jsonl (on errors)
- GitHub via GitHub MCP (commits)

**Circuit Breaker:** 3 consecutive failures → escalates to Meta-Coordinator

**Activation:** Routed by Meta-Coordinator for simple tasks

---

#### Agent 3: Claude-Specialist (Complex Execution)
**Type:** WRITE-ENABLED  
**Purpose:** Cloud API execution for complex tasks

**Responsibilities:**
- Handles complex, nuanced implementations
- Advanced reasoning for architectural challenges
- Higher quality output, higher cost
- Commits code to GitHub via GitHub MCP

**Reads From:**
- session_state.json (task assignment, architectural design)

**Writes To:**
- Project files via FSMCP
- session_state.json (execution result)
- failure_events.jsonl (on errors)
- GitHub via GitHub MCP (commits)

**Circuit Breaker:** 3 consecutive failures → escalates to Meta-Coordinator

**Activation:** Routed by Meta-Coordinator for complex tasks

---

#### Agent 11: Linter-Fixer (Code Repair)
**Type:** WRITE-ENABLED  
**Purpose:** Automated code repair and linting

**Responsibilities:**
- Fixes linting errors, formatting issues
- Applies automated repairs for common mistakes
- Does NOT handle logic errors (escalates to execution agents)
- Commits fixes to GitHub via GitHub MCP

**Reads From:**
- session_state.json (Critic feedback, issues to fix)
- Existing code files via FSMCP

**Writes To:**
- Project files via FSMCP (fixed code)
- applied_fixes.jsonl (repair log)
- session_state.json (repair result)
- GitHub via GitHub MCP (commits)

**Circuit Breaker:** 3 consecutive failures → escalates to Meta-Coordinator

**Activation:** Routed by Meta-Coordinator after Critic identifies fixable issues

---

### TIER 5: SESSION MANAGEMENT

#### Agent 19: Session-Manager (Startup/Shutdown Handler)
**Type:** READ-ONLY  
**Purpose:** Session lifecycle management

**Responsibilities:**
- Reads session_summary.json on startup (resumption data)
- Initializes system state for Meta-Coordinator
- Writes session_summary.json on shutdown (accomplished tasks, next steps)
- Does NOT participate in task execution loop

**Reads From:**
- session_summary.json (previous session state)

**Writes To:**
- session_summary.json (session summary at shutdown)

**Activation:** 
- Session start: User initiates system
- Session end: Meta-Coordinator signals shutdown

---

## INFRASTRUCTURE COMPONENTS

### State Management Files

#### session_state.json (Single Source of Truth)
**Purpose:** Current system state, active tasks, agent status  
**Write Pattern:** Atomic writes with retry (prevents corruption)  
**Lock Timeout:** 5 seconds (releases lock if write hangs)  
**Schema:**
```json
{
  "current_task": "string",
  "assigned_agent": "string",
  "complexity": "simple|complex",
  "architectural_design": {},
  "dependency_report": {},
  "review_verdict": "approved|needs_repair|rejected",
  "last_updated": "ISO timestamp",
  "agent_status": {
    "agent_name": "idle|active|blocked|failed"
  }
}
```

---

#### failure_events.jsonl (Error Log)
**Purpose:** Append-only failure tracking  
**Write Pattern:** Append-only (no overwrites)  
**Schema:**
```json
{"timestamp": "ISO", "agent": "string", "error": "string", "task": "string", "retry_count": 0}
```

**Usage:**
- Auto-Debug analyzes for patterns
- Skill-Recommender identifies capability gaps
- Meta-Coordinator checks for circuit breaker trips

---

#### applied_fixes.jsonl (Repair History)
**Purpose:** Track all automated repairs  
**Write Pattern:** Append-only  
**Schema:**
```json
{"timestamp": "ISO", "agent": "linter-fixer", "original_issue": "string", "fix_applied": "string", "files_modified": []}
```

**Usage:**
- Fix-Validation verifies repair quality
- Auto-Debug correlates fixes with outcomes

---

#### conversation_logs/ (Agent Transcripts)
**Purpose:** Full audit trail of agent interactions  
**Write Pattern:** Per-agent log files, timestamped entries  
**Retention:** 7 days (age-based pruning)  
**Schema:** Plain text transcripts with timestamps

**Usage:**
- Latency-Profiler tracks performance
- Cost-Tracker calculates API usage
- Debugging and audit trail

---

#### session_summary.json (Resumption Data)
**Purpose:** Persistent state across sessions  
**Write Pattern:** Overwrite on session end  
**Schema:**
```json
{
  "session_id": "string",
  "start_time": "ISO",
  "end_time": "ISO",
  "accomplished": ["task1", "task2"],
  "next_steps": ["action1", "action2"],
  "incomplete_tasks": [],
  "system_health": "healthy|degraded|failed"
}
```

**Usage:**
- Session-Manager reads on startup
- Session-Manager writes on shutdown
- Enables seamless resumption

---

## FORCING FUNCTIONS (SAFETY MECHANISMS)

### 1. Timeboxed Execution Windows
**Problem:** Agents running indefinitely without progress  
**Solution:** Hard timeouts enforced by Meta-Coordinator

**Timeouts:**
- **5 minutes idle:** Agent flagged as stale
- **10 minutes idle:** Auto-escalation to Meta-Coordinator
- **15 minutes idle:** Hard timeout, agent terminated, task reassigned

**Implementation:** Meta-Coordinator monitors last_updated timestamps in session_state.json

---

### 2. Output Requirement Gates
**Problem:** Agents completing without producing deliverables  
**Solution:** Every agent must write to session_state.json before completion

**Validation:**
- Meta-Coordinator checks state file for agent output
- Missing output = agent marked as failed
- Prevents silent failures

---

### 3. Stale Task Pruning
**Problem:** Abandoned tasks blocking system resources  
**Solution:** Aggressive timeout + automatic cleanup

**Process:**
1. 5min idle → Meta-Coordinator investigation
2. 10min idle → Task marked as stale
3. 15min idle → Task canceled, resources freed

---

### 4. Circuit Breakers (3-Strike Rule)
**Problem:** Agents failing repeatedly on same task  
**Solution:** Escalation to Meta-Coordinator after 3 failures

**Process:**
1. Failure #1: Retry same agent
2. Failure #2: Retry same agent
3. Failure #3: Circuit breaker trips → Meta-Coordinator intervention
4. Meta-Coordinator options:
   - Route to different agent (Ollama → Claude)
   - Trigger Auto-Debug for pattern analysis
   - Escalate to user

**Tracked In:** failure_events.jsonl

---

### 5. Read-Only Enforcement
**Problem:** Analysis agents modifying code, causing scope creep  
**Solution:** Strict file system permissions + architectural boundaries

**Enforcement:**
- 7 analysis agents: NO write access to project files
- Only 3 execution agents: WRITE-ENABLED
- MCP server enforces file permissions
- Violations logged as failures

---

### 6. Centralized Routing Authority
**Problem:** Agents making routing decisions, causing chaos  
**Solution:** Meta-Coordinator makes ALL routing decisions

**Flow:**
1. Agent completes task
2. Agent writes result to session_state.json
3. Agent signals completion to Meta-Coordinator
4. Meta-Coordinator reads state
5. Meta-Coordinator decides next agent
6. Repeat

**No "next_agent" Fields:** Agents NEVER specify who runs next

---

## WORKFLOW EXAMPLES

### Example 1: Simple Task - Local Execution

**Task:** "Add input validation to login form"

**Flow:**
1. **User** → submits task
2. **Session-Manager** → loads session_summary.json (if resuming)
3. **Router (Agent 1)** → analyzes complexity: "Simple task, Ollama-capable"
4. **Router** → writes recommendation to session_state.json
5. **Meta-Coordinator (Agent 14)** → reads recommendation, routes to Ollama-Specialist
6. **Ollama-Specialist (Agent 2)** → generates validation code
7. **Ollama-Specialist** → writes code to files via FSMCP
8. **Ollama-Specialist** → commits to GitHub via GitHub MCP
9. **Ollama-Specialist** → writes result to session_state.json
10. **Ollama-Specialist** → signals completion to Meta-Coordinator
11. **Meta-Coordinator** → routes to Critic
12. **Critic (Agent 6)** → reviews code: "Approved"
13. **Critic** → writes verdict to session_state.json
14. **Meta-Coordinator** → routes to Logger
15. **Logger (Agent 7)** → records transaction to conversation_logs/
16. **Meta-Coordinator** → signals task complete to user

**Total Agents Involved:** 5 (Router, Meta-Coordinator, Ollama-Specialist, Critic, Logger)

---

### Example 2: Complex Task - Architecture + Cloud Execution

**Task:** "Implement OAuth2 authentication with refresh tokens"

**Flow:**
1. **User** → submits task
2. **Router (Agent 1)** → analyzes: "Complex, architecture needed"
3. **Router** → writes recommendation: "Complex + Architecture"
4. **Meta-Coordinator** → routes to Dependency-Scout first
5. **Dependency-Scout (Agent 9)** → scans dependencies: "Need passport, jsonwebtoken packages"
6. **Dependency-Scout** → writes dependency report to session_state.json
7. **Meta-Coordinator** → routes to Architect
8. **Architect (Agent 5)** → scans project structure via FSMCP
9. **Architect** → designs: auth/ folder, middleware, routes
10. **Architect** → writes design to session_state.json
11. **Meta-Coordinator** → routes to Claude-Specialist (complex task)
12. **Claude-Specialist (Agent 3)** → implements OAuth2 based on Architect design
13. **Claude-Specialist** → writes code to files via FSMCP
14. **Claude-Specialist** → commits to GitHub via GitHub MCP
15. **Claude-Specialist** → writes result to session_state.json
16. **Meta-Coordinator** → routes to Critic
17. **Critic (Agent 6)** → reviews: "Security issue: tokens not encrypted"
18. **Critic** → writes verdict: "Needs repair"
19. **Meta-Coordinator** → routes back to Claude-Specialist (not LinterFix, logic issue)
20. **Claude-Specialist** → adds encryption
21. **Claude-Specialist** → writes fix to files
22. **Claude-Specialist** → commits fix
23. **Meta-Coordinator** → routes to Critic
24. **Critic** → reviews: "Approved"
25. **Meta-Coordinator** → routes to Logger
26. **Logger** → records transaction
27. **Meta-Coordinator** → signals task complete

**Total Agents Involved:** 6 (Router, Meta-Coordinator, Dependency-Scout, Architect, Claude-Specialist, Critic, Logger)

---

### Example 3: Circuit Breaker Escalation

**Task:** "Fix broken API endpoint"

**Flow:**
1. **User** → submits task
2. **Router** → analyzes: "Simple bug fix"
3. **Meta-Coordinator** → routes to Ollama-Specialist
4. **Ollama-Specialist** → attempts fix, FAILS (API keys issue)
5. **Ollama-Specialist** → writes failure to failure_events.jsonl
6. **Meta-Coordinator** → retries with Ollama-Specialist (attempt #2)
7. **Ollama-Specialist** → attempts fix, FAILS (same issue)
8. **Ollama-Specialist** → writes failure to failure_events.jsonl
9. **Meta-Coordinator** → retries with Ollama-Specialist (attempt #3)
10. **Ollama-Specialist** → attempts fix, FAILS (same issue)
11. **Circuit Breaker TRIPS** (3 failures)
12. **Meta-Coordinator** → triggers Auto-Debug (Agent 12)
13. **Auto-Debug** → analyzes failure_events.jsonl: "Missing API key in .env"
14. **Auto-Debug** → writes diagnosis to debug_analysis.json
15. **Meta-Coordinator** → escalates to user: "Needs manual intervention: API key missing"
16. **User** → adds API key
17. **Meta-Coordinator** → routes to Claude-Specialist (escalated from Ollama)
18. **Claude-Specialist** → fixes endpoint successfully
19. **Meta-Coordinator** → routes to Critic
20. **Critic** → approves
21. **Meta-Coordinator** → routes to Logger
22. **Meta-Coordinator** → task complete

**Meta-Agents Triggered:** Auto-Debug  
**Escalation:** Ollama → User Intervention → Claude

---

### Example 4: Deadlock Detection

**Scenario:** Architect waiting for Dependency-Scout, Dependency-Scout waiting for Architect (circular dependency)

**Flow:**
1. **Meta-Coordinator** → routes to Architect
2. **Architect** → scans structure, writes: "Needs dependency analysis first"
3. **Meta-Coordinator** → routes to Dependency-Scout
4. **Dependency-Scout** → scans dependencies, writes: "Needs architecture design first"
5. **Circular Wait Detected**
6. **Deadlock-Detector (Agent 18)** → monitors session_state.json
7. **Deadlock-Detector** → detects: "Architect waiting on DepScout, DepScout waiting on Architect"
8. **Deadlock-Detector** → writes alert to deadlock_alerts.json
9. **Deadlock-Detector** → signals Meta-Coordinator
10. **Meta-Coordinator** → breaks deadlock: "Run Architect first with basic assumptions"
11. **Architect** → completes design without full dependency info
12. **Meta-Coordinator** → routes to Dependency-Scout
13. **Dependency-Scout** → completes analysis with Architect's design
14. **Meta-Coordinator** → routes back to Architect for refinement (if needed)
15. **System resumes normal flow**

**Prevention:** Strict agent ordering rules enforced by Meta-Coordinator

---

## MCP SERVER INTEGRATION

### GitHub MCP
**Purpose:** Version control operations  
**Used By:** Ollama-Specialist, Claude-Specialist, Linter-Fixer  
**Operations:**
- Commit code changes
- Create branches
- Push to remote
- Read repository structure

**Read-Only Agents:** Cannot access GitHub MCP (enforced by permissions)

---

### Jira MCP
**Purpose:** External ticket system integration  
**Used By:** Jira-Sync (Agent 10)  
**Operations:**
- Fetch ticket details
- Read requirements
- Read acceptance criteria

**Read-Only:** Does NOT create or update tickets

---

### Filesystem MCP
**Purpose:** Project file access  
**Used By:**
- **Read-Only:** Router, Architect, Critic, Watcher, Dependency-Scout
- **Write-Enabled:** Ollama-Specialist, Claude-Specialist, Linter-Fixer

**Operations:**
- Read files (all agents)
- Write files (execution agents only)
- Monitor file changes (Watcher)

**Permission Enforcement:** MCP server validates agent permissions before file writes

---

## CRITICAL REVIEW QUESTIONS

### 1. Deadlock Risk Assessment
**Question:** Can the current architecture create deadlocks where no agent can proceed?

**Identified Risks:**
- Critic → LinterFix → Critic loop (could cycle forever)
- Architect ↔ Dependency-Scout circular wait
- All agents waiting on State file lock

**Mitigations:**
- 3-attempt limit on Critic → LinterFix loop
- Strict ordering: Architect runs before Dependency-Scout
- 5-second write timeout on session_state.json
- Deadlock-Detector monitors for circular waits

**Residual Risk:** Medium - Depends on Meta-Coordinator implementation quality

---

### 2. Meta-Coordinator Single Point of Failure
**Question:** If Meta-Coordinator fails, does the entire system halt?

**Answer:** YES - Critical single point of failure

**Mitigation Options:**
- Heartbeat monitoring: External watchdog checks Meta-Coordinator health
- Auto-restart: If Meta-Coordinator crashes, system auto-restarts it
- Fallback routing rules: System defaults to basic Router decisions if Meta-Coordinator unavailable
- Session-Manager can resurrect Meta-Coordinator from last known state

**Recommendation:** Implement fallback routing + auto-restart

---

### 3. Read-Only Enforcement Bypass
**Question:** Can read-only agents circumvent write restrictions?

**Attack Vectors:**
- Agent instructs execution agent to write on its behalf (social engineering)
- Agent exploits MCP server vulnerability
- Agent writes to unprotected locations (/tmp, logs)

**Mitigations:**
- Execution agents ignore "instructions" from read-only agents (only respond to Meta-Coordinator)
- MCP server enforces agent-based permissions (Agent 5 = read-only regardless of request)
- All write locations protected, including /tmp

**Residual Risk:** Low - Depends on MCP server implementation

---

### 4. Infinite Loop Prevention
**Question:** Can agents get stuck in infinite retry loops?

**Identified Risks:**
- Circuit breaker trips after 3 failures, but what if fix attempt also fails?
- Auto-Debug triggers, but recommendations ignored, same failure repeats

**Mitigations:**
- Global task timeout: 15 minutes hard limit
- Meta-Coordinator tracks total retry count across ALL agents for same task
- After 10 total attempts (across agents), escalate to user regardless of circuit breaker
- Stale task pruning: 15min idle = task canceled

**Residual Risk:** Low - Multiple layers of timeout protection

---

### 5. State File Corruption
**Question:** What happens if session_state.json becomes corrupted?

**Scenarios:**
- Atomic write fails mid-operation
- Concurrent writes from multiple agents (race condition)
- Disk full during write

**Mitigations:**
- Atomic write pattern: Write to temp file → rename (atomic operation)
- Single writer: Only one agent writes at a time (enforced by lock)
- Lock timeout: 5 seconds max hold time
- Backup state: session_state.backup.json written every 10 minutes
- Corruption detection: JSON parse validation before reads

**Recovery:**
- If current state corrupted, load from backup
- If backup also corrupted, Session-Manager reconstructs from conversation_logs/

**Residual Risk:** Low - Multiple recovery mechanisms

---

### 6. Cost Explosion Risk
**Question:** Can the system generate runaway API costs?

**Scenarios:**
- Infinite retry loop calling Claude-Specialist repeatedly
- Latency-Profiler never triggers, costs go unnoticed
- User doesn't check Cost-Tracker reports

**Mitigations:**
- Hard budget limits: Cost-Tracker can PAUSE system if threshold exceeded
- Meta-Coordinator requires Cost-Tracker approval for Claude-Specialist after 5 uses in one session
- Daily cost reports emailed to user
- Circuit breaker limits Claude-Specialist retries

**Recommendation:** Add hard budget limits with system pause capability

---

### 7. Skill Recommender Implementation
**Question:** How does Skill-Recommender actually create and deploy new skills?

**Process:**
1. Skill-Recommender analyzes failures, identifies gap: "Need oauth-patterns skill"
2. Skill-Recommender drafts skill outline: required tools, example patterns, success criteria
3. Skill-Recommender writes proposal to skill_proposals.json
4. **User approval required** - System does NOT auto-deploy skills
5. User reviews proposal, approves/rejects
6. If approved, user (or future automation) creates skill file in Continue's skills directory
7. Architect and execution agents now have access to new skill

**Current Gap:** No automation for steps 5-7, requires manual intervention

**Future Enhancement:** Auto-deployment with user approval via API

---

### 8. Session Resumption Reliability
**Question:** Can the system reliably resume after crashes or shutdowns?

**Requirements:**
- Session-Manager reads session_summary.json
- Meta-Coordinator reconstructs agent states
- Incomplete tasks resume from last checkpoint

**Challenges:**
- What if crash happens mid-task, no checkpoint?
- What if session_summary.json is stale (not written on crash)?

**Mitigations:**
- Periodic checkpoints: Session-Manager writes summary every 10 minutes, not just at shutdown
- Crash recovery: Meta-Coordinator can reconstruct state from conversation_logs/ + failure_events.jsonl
- Task replay: System can replay last 5 agent actions to determine state

**Residual Risk:** Medium - Complex reconstruction logic required

---

### 9. Parallel Execution Safety
**Question:** Can multiple agents run in parallel without conflicts?

**Current Design:** Sequential execution - one agent at a time

**Parallel Opportunities:**
- Read-only agents can run in parallel (Architect + Dependency-Scout simultaneously)
- Meta-agents can run in parallel (Latency-Profiler + Cost-Tracker)

**Conflicts:**
- Multiple agents writing to session_state.json (race condition)
- Execution agents modifying same files

**Recommendation for Phase 2:**
- Allow parallel read-only agents
- Keep execution agents sequential
- Implement per-agent state sections in session_state.json to avoid write conflicts

**Current Risk:** Low - Sequential execution avoids conflicts

---

### 10. External Dependency Failures
**Question:** What if MCP servers (GitHub, Jira, Filesystem) become unavailable?

**Scenarios:**
- GitHub MCP down → Execution agents can't commit
- Jira MCP down → Jira-Sync fails
- Filesystem MCP down → Entire system halts

**Mitigations:**
- Health checks: Meta-Coordinator pings MCP servers before routing tasks
- Graceful degradation: If GitHub down, execute tasks locally, commit later
- Circuit breakers: After 3 MCP failures, Meta-Coordinator escalates to user
- Offline mode: System continues with reduced functionality

**Recommendation:** Implement MCP health checks + offline mode

---

## PERFORMANCE ESTIMATES

### Task Completion Times (Estimated)

**Simple Task (Ollama Path):**
- Router: 10s
- Meta-Coordinator: 5s
- Ollama-Specialist: 30s
- Critic: 15s
- Logger: 5s
- **Total: ~65 seconds**

**Complex Task (Claude Path with Architecture):**
- Router: 10s
- Meta-Coordinator: 5s
- Dependency-Scout: 20s
- Architect: 60s
- Meta-Coordinator: 5s
- Claude-Specialist: 120s
- Critic: 20s
- Logger: 5s
- **Total: ~245 seconds (~4 minutes)**

**Circuit Breaker Escalation (3 Failures):**
- 3 failed attempts: 3 × 30s = 90s
- Auto-Debug analysis: 30s
- Meta-Coordinator escalation: 10s
- User response time: variable
- Claude-Specialist retry: 120s
- Critic + Logger: 25s
- **Total: ~275 seconds + user response time**

---

### Throughput Estimates

**Assumptions:**
- Average task mix: 60% simple, 30% complex, 10% circuit breaker escalations
- Sequential execution (one task at a time)

**Hourly Throughput:**
- Simple tasks: 60 × 60s / 65s = ~55 tasks/hour
- Complex tasks: 30 × 60s / 245s = ~7 tasks/hour
- Escalations: 10 × 60s / 275s = ~2 tasks/hour

**Weighted Average:** (55 × 0.6) + (7 × 0.3) + (2 × 0.1) = 33 + 2.1 + 0.2 = **~35 tasks/hour**

**Daily Capacity:** 35 × 8 hours = **~280 tasks/day** (assuming 8-hour workday)

---

## COST ANALYSIS

### API Cost Estimates

**Assumptions:**
- Claude API: $3 per million input tokens, $15 per million output tokens
- Ollama: Self-hosted, negligible cost
- Average Claude task: 10k input tokens, 2k output tokens
- Average Ollama task: 5k input tokens, 1k output tokens

**Per-Task Costs:**
- Claude task: (10k × $3/1M) + (2k × $15/1M) = $0.03 + $0.03 = **$0.06**
- Ollama task: **~$0** (self-hosted)

**Daily Cost (280 tasks, 60% Ollama, 40% Claude):**
- Ollama tasks: 168 × $0 = $0
- Claude tasks: 112 × $0.06 = **$6.72/day**

**Monthly Cost:** $6.72 × 30 = **~$202/month**

**Cost Optimization Opportunities:**
- Increase Ollama usage to 80% → **~$101/month** (50% cost reduction)
- Implement caching for repeated patterns → **~20% reduction**
- Use Claude Haiku for simple reviews → **~40% reduction on Critic costs**

---

## DEPLOYMENT STRATEGY

### Phase 1: Core Foundation (Weeks 1-2)
**Deliverables:**
- session_state.json implementation with atomic writes
- Meta-Coordinator basic routing logic
- Router, Ollama-Specialist, Critic, Logger (minimal viable path)
- Circuit breaker with 3-strike rule
- Session-Manager for startup/shutdown

**Success Criteria:**
- Single simple task completes end-to-end
- Circuit breaker trips on 3 failures
- State persists across sessions

---

### Phase 2: Analysis Layer (Weeks 3-4)
**Deliverables:**
- Architect, Dependency-Scout, Watcher
- MCP server integration (Filesystem, GitHub)
- Architectural task flow (Router → Architect → Execution → Critic)

**Success Criteria:**
- Complex task with architecture completes
- Dependencies detected and handled
- File changes monitored

---

### Phase 3: Execution Expansion (Weeks 5-6)
**Deliverables:**
- Claude-Specialist
- Linter-Fixer
- Jira-Sync + Jira MCP integration
- Complexity-based routing (Ollama vs Claude)

**Success Criteria:**
- Claude handles complex tasks successfully
- Linter fixes applied automatically
- Jira tickets provide context

---

### Phase 4: Meta-Agent Intelligence (Weeks 7-9)
**Deliverables:**
- Auto-Debug, Fix-Validation, Routing-Optimizer
- Latency-Profiler, Cost-Tracker
- Skill-Recommender, Deadlock-Detector
- Meta-Coordinator triggers meta-agents based on conditions

**Success Criteria:**
- System self-optimizes routing over time
- Failure patterns identified automatically
- Performance bottlenecks detected
- Costs tracked and optimized

---

### Phase 5: Production Hardening (Weeks 10-12)
**Deliverables:**
- MCP health checks + offline mode
- Parallel execution for read-only agents
- Hard budget limits with auto-pause
- Comprehensive error recovery
- User dashboard for monitoring

**Success Criteria:**
- System handles MCP failures gracefully
- Parallel tasks improve throughput
- Budget limits prevent cost overruns
- 99% uptime over 1 week

---

## SUCCESS METRICS

### Primary Metrics
1. **Task Success Rate:** % of tasks completed without user intervention
   - Target: >85% for simple tasks, >70% for complex tasks

2. **Mean Time to Completion:** Average time from task submission to Logger completion
   - Target: <2 minutes for simple tasks, <5 minutes for complex tasks

3. **Cost Efficiency:** Average cost per completed task
   - Target: <$0.05 per task

4. **Circuit Breaker Rate:** % of tasks requiring circuit breaker escalation
   - Target: <10% of all tasks

5. **Deadlock Incidents:** Count of deadlocks requiring manual intervention
   - Target: 0 per week after Phase 4

---

### Secondary Metrics
1. **Meta-Agent Effectiveness:** % of Auto-Debug recommendations that prevent future failures
2. **Routing Accuracy:** % of Router complexity assessments validated by outcomes
3. **Fix Quality:** % of Linter-Fixer repairs approved by Critic on first review
4. **Session Resumption Success:** % of crashed sessions successfully resumed
5. **API Cost Trend:** Month-over-month cost reduction from Routing-Optimizer improvements

---

## OPEN QUESTIONS FOR SENIOR REVIEW

1. **Meta-Coordinator Redundancy:** Should we implement a backup Meta-Coordinator for failover?

2. **Parallel Execution Scope:** Which agents can safely run in parallel without state conflicts?

3. **State File Sharding:** Should we split session_state.json into per-agent state files to reduce write contention?

4. **User Approval Workflows:** How should Skill-Recommender proposals be surfaced to users? Email? Dashboard? Slack?

5. **MCP Fallback Strategy:** If GitHub MCP fails, should execution agents write to local git repo and sync later?

6. **Agent Communication Protocol:** Should agents use event bus instead of polling session_state.json?

7. **Cost Budget Enforcement:** Should Cost-Tracker have authority to BLOCK tasks, or only warn users?

8. **Deadlock Resolution Authority:** Should Deadlock-Detector auto-break deadlocks, or always escalate to Meta-Coordinator?

9. **Circuit Breaker Thresholds:** Is 3 failures the right threshold, or should it vary by agent and task complexity?

10. **Session Summary Frequency:** Should Session-Manager write checkpoints every 10 minutes, or only at shutdown?

---

## RISKS AND MITIGATION SUMMARY

| Risk | Severity | Mitigation | Residual Risk |
|------|----------|------------|---------------|
| Meta-Coordinator single point of failure | HIGH | Heartbeat monitoring, auto-restart, fallback routing | MEDIUM |
| State file corruption | MEDIUM | Atomic writes, backups, reconstruction from logs | LOW |
| Infinite retry loops | MEDIUM | Global task timeout, stale task pruning, 10-attempt limit | LOW |
| Cost explosion | MEDIUM | Hard budget limits, Cost-Tracker approval gates | LOW |
| Deadlock (Critic ↔ LinterFix) | MEDIUM | 3-attempt limit, Meta-Coordinator escalation | LOW |
| Deadlock (Architect ↔ DepScout) | MEDIUM | Strict ordering rules, Deadlock-Detector monitoring | LOW |
| MCP server failures | MEDIUM | Health checks, graceful degradation, offline mode | MEDIUM |
| Session resumption failure | LOW | Periodic checkpoints, log reconstruction | MEDIUM |
| Read-only enforcement bypass | LOW | MCP permission enforcement, execution agent validation | LOW |
| Parallel execution conflicts | LOW | Sequential execution in Phase 1-4 | N/A |

---

## CONCLUSION

This architectural plan presents a comprehensive 19-agent system designed for automated software development with strict separation of concerns. The forcing function approach (read-only boundaries) prevents scope creep and ensures clean agent responsibilities.

**Key Strengths:**
- Centralized routing authority prevents agent chaos
- Multiple layers of safety (circuit breakers, timeouts, deadlock detection)
- Self-optimization through meta-agent intelligence
- Clear separation between analysis and execution

**Key Concerns:**
- Meta-Coordinator single point of failure
- Complex state management with potential for corruption
- Session resumption reliability depends on checkpoint quality
- Cost optimization requires continuous monitoring

**Recommendation:** Proceed with phased deployment, prioritizing core foundation and safety mechanisms before adding meta-agent intelligence.

**Next Steps:**
1. Senior engineering review and approval
2. Prototype Phase 1 (Core Foundation)
3. Load testing with synthetic tasks
4. Iterate based on failure analysis
5. Deploy Phase 2-5 incrementally

---

**Document End**

**Prepared For:** Senior Development Engineer & Technical Advisor  
**Prepared By:** System Architect  
**Review Status:** PENDING EXPERT EVALUATION  
**Next Review Date:** TBD