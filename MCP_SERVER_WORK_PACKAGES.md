# MCP Server Implementation - Work Packages

**Project Goal:** Create a stdio-based MCP server that exposes all 19 agents as tools in OpenCode and other MCP clients.

**Lead Architect:** Claude (you're interacting with me now)  
**Local Agent:** Will execute each work package independently  
**Workflow:** Lead/Local with "Ralph Wiggum Rail" verification (max 5 iterations)

---

## WORK PACKAGE 1: Install MCP SDK and Setup Project Structure

### Objective
Install the Model Context Protocol SDK and create the basic directory structure for the MCP server.

### Prerequisites
- Node.js and npm installed
- Access to C:\Users\erikc\Dev\Agents directory
- Internet connection for npm package installation

### Tasks
1. Install the MCP SDK package: `@modelcontextprotocol/sdk`
2. Create `mcp-server/` directory structure
3. Add npm script for running the MCP server
4. Update .gitignore if needed

### Detailed Instructions for Local Agent

#### Step 1: Install MCP SDK
```bash
npm install @modelcontextprotocol/sdk --save
```

#### Step 2: Create directory structure
```bash
mkdir -p mcp-server
touch mcp-server/index.ts
touch mcp-server/types.ts
touch mcp-server/agent-manager.ts
touch mcp-server/tools.ts
```

#### Step 3: Update package.json
Add the following script to the `"scripts"` section:
```json
"mcp:serve": "node --loader ts-node/esm mcp-server/index.ts"
```

### Bash Verification Loop (Ralph Wiggum Rail)
**Max Iterations: 5**

Create and run this verification script: `verify-wp1.sh`

```bash
#!/bin/bash

ITERATION=0
MAX_ITERATIONS=5
ERRORS=()

echo "=== Work Package 1 Verification ==="

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  echo "Iteration $ITERATION of $MAX_ITERATIONS"
  ERRORS=()
  
  # Check 1: Verify MCP SDK is installed
  if ! npm list @modelcontextprotocol/sdk &>/dev/null; then
    ERRORS+=("MCP SDK not installed")
  fi
  
  # Check 2: Verify directory structure
  if [ ! -d "mcp-server" ]; then
    ERRORS+=("mcp-server directory missing")
  fi
  
  if [ ! -f "mcp-server/index.ts" ]; then
    ERRORS+=("mcp-server/index.ts missing")
  fi
  
  if [ ! -f "mcp-server/types.ts" ]; then
    ERRORS+=("mcp-server/types.ts missing")
  fi
  
  if [ ! -f "mcp-server/agent-manager.ts" ]; then
    ERRORS+=("mcp-server/agent-manager.ts missing")
  fi
  
  if [ ! -f "mcp-server/tools.ts" ]; then
    ERRORS+=("mcp-server/tools.ts missing")
  fi
  
  # Check 3: Verify npm script exists
  if ! grep -q '"mcp:serve"' package.json; then
    ERRORS+=("mcp:serve script not found in package.json")
  fi
  
  # If no errors, exit successfully
  if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "✓ All checks passed!"
    exit 0
  fi
  
  # Display errors
  echo "✗ Errors found:"
  for error in "${ERRORS[@]}"; do
    echo "  - $error"
  done
  
  # Attempt auto-fix
  echo "Attempting auto-fix..."
  
  if [[ " ${ERRORS[@]} " =~ "MCP SDK not installed" ]]; then
    npm install @modelcontextprotocol/sdk --save
  fi
  
  if [[ " ${ERRORS[@]} " =~ "mcp-server directory missing" ]]; then
    mkdir -p mcp-server
  fi
  
  for file in "index.ts" "types.ts" "agent-manager.ts" "tools.ts"; do
    if [ ! -f "mcp-server/$file" ]; then
      touch "mcp-server/$file"
    fi
  done
  
  echo ""
done

echo "✗ Failed after $MAX_ITERATIONS iterations"
echo "Errors remaining:"
for error in "${ERRORS[@]}"; do
  echo "  - $error"
done
exit 1
```

**Run with:**
```bash
chmod +x verify-wp1.sh
./verify-wp1.sh
```

### Definition of Done (DoD)

- [ ] `@modelcontextprotocol/sdk` package is installed and appears in package.json dependencies
- [ ] `mcp-server/` directory exists with all 4 TypeScript files (index.ts, types.ts, agent-manager.ts, tools.ts)
- [ ] `npm run mcp:serve` script exists in package.json
- [ ] Verification script passes with 0 errors
- [ ] All file creation is documented in a CHANGELOG-WP1.md file

### Deliverables
Return to Lead Architect:
1. Screenshot or output of `npm list @modelcontextprotocol/sdk`
2. Directory listing: `ls -la mcp-server/`
3. package.json scripts section
4. Output of verification script
5. CHANGELOG-WP1.md documenting any deviations from spec

---

## WORK PACKAGE 2: Create MCP Server Entry Point with Stdio Transport

### Objective
Implement the main MCP server file (index.ts) that sets up stdio transport and handles the MCP protocol.

### Prerequisites
- Work Package 1 completed successfully
- Understanding of TypeScript async/await patterns
- Familiarity with Node.js stdio streams

### Tasks
1. Create basic MCP server class in `mcp-server/index.ts`
2. Setup stdio transport for communication with OpenCode
3. Implement server lifecycle (startup, shutdown)
4. Add basic error handling

### Detailed Instructions for Local Agent

#### Implementation: mcp-server/index.ts

```typescript
#!/usr/bin/env node

/**
 * MCP Server Entry Point
 * Exposes 19 agents from multi-agent system as MCP tools
 * Transport: stdio (for OpenCode and other MCP clients)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { AgentManager } from './agent-manager.js';
import { AGENT_TOOLS } from './tools.js';

/**
 * Main MCP Server Class
 */
class AgentMCPServer {
  private server: Server;
  private agentManager: AgentManager;

  constructor() {
    this.server = new Server(
      {
        name: 'multi-agent-dev-system',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.agentManager = new AgentManager();
    this.setupHandlers();
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // List available tools (agent actions)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: AGENT_TOOLS,
    }));

    // Handle tool calls (agent executions)
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.agentManager.executeTool(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources (logs, state files)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [], // Will be implemented in WP8
    }));

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      throw new Error('Resources not yet implemented'); // Will be implemented in WP8
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log to stderr (stdout is reserved for MCP protocol)
    console.error('Multi-Agent MCP Server running on stdio');
    console.error('Available agents: 19');
    console.error('Protocol: Model Context Protocol v1.0');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.agentManager.cleanup();
    await this.server.close();
    console.error('MCP Server shutdown complete');
  }
}

/**
 * Main execution
 */
async function main() {
  const server = new AgentMCPServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down...');
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down...');
    await server.shutdown();
    process.exit(0);
  });

  // Start server
  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### Bash Verification Loop (Ralph Wiggum Rail)
**Max Iterations: 5**

Create and run: `verify-wp2.sh`

```bash
#!/bin/bash

ITERATION=0
MAX_ITERATIONS=5
ERRORS=()

echo "=== Work Package 2 Verification ==="

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  echo "Iteration $ITERATION of $MAX_ITERATIONS"
  ERRORS=()
  
  # Check 1: File exists
  if [ ! -f "mcp-server/index.ts" ]; then
    ERRORS+=("mcp-server/index.ts does not exist")
  fi
  
  # Check 2: TypeScript syntax check
  if [ -f "mcp-server/index.ts" ]; then
    if ! npx tsc --noEmit mcp-server/index.ts 2>/dev/null; then
      ERRORS+=("TypeScript syntax errors in index.ts")
    fi
  fi
  
  # Check 3: Contains required imports
  if [ -f "mcp-server/index.ts" ]; then
    if ! grep -q "from '@modelcontextprotocol/sdk" mcp-server/index.ts; then
      ERRORS+=("Missing MCP SDK imports")
    fi
    
    if ! grep -q "StdioServerTransport" mcp-server/index.ts; then
      ERRORS+=("Missing StdioServerTransport import")
    fi
    
    if ! grep -q "AgentManager" mcp-server/index.ts; then
      ERRORS+=("Missing AgentManager import")
    fi
  fi
  
  # Check 4: Contains required classes/functions
  if [ -f "mcp-server/index.ts" ]; then
    if ! grep -q "class AgentMCPServer" mcp-server/index.ts; then
      ERRORS+=("AgentMCPServer class not found")
    fi
    
    if ! grep -q "async function main" mcp-server/index.ts; then
      ERRORS+=("main function not found")
    fi
  fi
  
  # Check 5: Has shebang for execution
  if [ -f "mcp-server/index.ts" ]; then
    if ! head -n 1 mcp-server/index.ts | grep -q "#!/usr/bin/env node"; then
      ERRORS+=("Missing shebang line")
    fi
  fi
  
  # If no errors, success!
  if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "✓ All checks passed!"
    echo "✓ File structure is correct"
    echo "✓ TypeScript syntax is valid"
    echo "✓ Required imports present"
    exit 0
  fi
  
  # Display errors
  echo "✗ Errors found:"
  for error in "${ERRORS[@]}"; do
    echo "  - $error"
  done
  
  # On last iteration, don't try to fix
  if [ $ITERATION -eq $MAX_ITERATIONS ]; then
    break
  fi
  
  echo "Attempting fixes... (manual intervention may be needed)"
  echo ""
done

echo "✗ Failed after $MAX_ITERATIONS iterations"
echo "Please review errors and provide error log to Lead Architect"
exit 1
```

**Run with:**
```bash
chmod +x verify-wp2.sh
./verify-wp2.sh
```

### Definition of Done (DoD)

- [ ] `mcp-server/index.ts` exists and contains AgentMCPServer class
- [ ] File has proper shebang (`#!/usr/bin/env node`)
- [ ] All required imports from MCP SDK are present
- [ ] TypeScript compiles with no syntax errors
- [ ] Code includes stdio transport setup
- [ ] Error handling for tool execution is implemented
- [ ] Graceful shutdown handlers (SIGINT, SIGTERM) are present
- [ ] Verification script passes with 0 errors
- [ ] CHANGELOG-WP2.md documents implementation

### Deliverables
Return to Lead Architect:
1. Complete `mcp-server/index.ts` file
2. Output of `npx tsc --noEmit mcp-server/index.ts`
3. Output of verification script
4. CHANGELOG-WP2.md documenting any deviations from spec

### Notes
- This file won't run yet because AgentManager and AGENT_TOOLS don't exist - that's expected
- We're verifying structure and TypeScript syntax only at this stage
- The server will be tested end-to-end in WP10

---

## WORK PACKAGE 3: Implement Agent Manager Singleton

### Objective
Create the AgentManager class that initializes and manages all 19 agent instances, handling state management and tool execution routing.

### Prerequisites
- Work Packages 1 and 2 completed
- Understanding of singleton pattern
- Knowledge of your existing agent architecture (StateManager, Logger, etc.)

### Tasks
1. Implement AgentManager class in `mcp-server/agent-manager.ts`
2. Initialize all 19 agents with proper dependencies
3. Create tool execution router
4. Implement cleanup/disposal methods

### Detailed Instructions for Local Agent

#### Implementation: mcp-server/agent-manager.ts

```typescript
/**
 * Agent Manager - Singleton for managing all 19 agents
 * Handles initialization, state management, and execution routing
 */

import { StateManager } from '../state/StateManager.js';
import { Logger } from '../agents/Logger.js';
import { SessionManager } from '../agents/SessionManager.js';
import { Router } from '../agents/Router.js';
import { MetaCoordinator } from '../agents/MetaCoordinator.js';
import { OllamaSpecialist } from '../agents/OllamaSpecialist.js';
import { ClaudeSpecialist } from '../agents/ClaudeSpecialist.js';
import { Critic } from '../agents/Critic.js';
import { Architect } from '../agents/Architect.js';
import { RepairAgent } from '../agents/RepairAgent.js';
import { AutoDebug } from '../agents/AutoDebug.js';
import { LogicArchivist } from '../agents/LogicArchivist.js';
import { DependencyScout } from '../agents/DependencyScout.js';
import { DataExtractor } from '../agents/DataExtractor.js';
import { PerformanceMonitor } from '../agents/PerformanceMonitor.js';
import { RoutingOptimizer } from '../agents/RoutingOptimizer.js';
import { Watcher } from '../agents/Watcher.js';

import * as path from 'path';

export class AgentManager {
  private static instance: AgentManager | null = null;
  
  // Infrastructure
  private stateManager!: StateManager;
  private logger!: Logger;
  private sessionManager!: SessionManager;
  
  // Core agents
  private router!: Router;
  private metaCoordinator!: MetaCoordinator;
  private ollamaSpecialist!: OllamaSpecialist;
  private claudeSpecialist!: ClaudeSpecialist;
  
  // Quality agents
  private critic!: Critic;
  private architect!: Architect;
  private repairAgent!: RepairAgent;
  
  // Support agents
  private autoDebug!: AutoDebug;
  private logicArchivist!: LogicArchivist;
  private dependencyScout!: DependencyScout;
  private dataExtractor!: DataExtractor;
  private performanceMonitor!: PerformanceMonitor;
  private routingOptimizer!: RoutingOptimizer;
  private watcher!: Watcher;
  
  private workingDir: string;
  private initialized: boolean = false;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  /**
   * Get singleton instance
   */
  static getInstance(workingDir?: string): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager(workingDir);
    }
    return AgentManager.instance;
  }

  /**
   * Initialize all agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.error('[AgentManager] Initializing infrastructure...');
    
    // Initialize infrastructure
    this.stateManager = new StateManager(
      path.join(this.workingDir, 'state', 'session_state.json')
    );
    await this.stateManager.initialize();
    
    this.logger = new Logger(path.join(this.workingDir, 'logs'));
    
    this.sessionManager = new SessionManager(
      path.join(this.workingDir, 'state', 'session_summary.json'),
      this.stateManager
    );

    console.error('[AgentManager] Initializing core agents...');
    
    // Initialize core agents
    this.router = new Router(this.stateManager, this.logger);
    this.metaCoordinator = new MetaCoordinator(this.stateManager, this.logger);
    this.ollamaSpecialist = new OllamaSpecialist(
      this.stateManager,
      this.logger,
      true, // useMCP
      this.workingDir
    );
    this.claudeSpecialist = new ClaudeSpecialist(
      this.stateManager,
      this.logger,
      this.workingDir
    );

    console.error('[AgentManager] Initializing quality agents...');
    
    // Initialize quality agents
    this.critic = new Critic(this.stateManager);
    this.architect = new Architect(this.workingDir, this.stateManager);
    this.repairAgent = new RepairAgent(this.stateManager, this.logger, this.workingDir);

    console.error('[AgentManager] Initializing support agents...');
    
    // Initialize support agents
    this.autoDebug = new AutoDebug(this.stateManager, this.logger);
    this.logicArchivist = new LogicArchivist(this.workingDir, this.stateManager);
    this.dependencyScout = new DependencyScout(this.workingDir);
    this.dataExtractor = new DataExtractor(this.stateManager);
    this.performanceMonitor = new PerformanceMonitor(this.stateManager);
    this.routingOptimizer = new RoutingOptimizer(this.stateManager);
    this.watcher = new Watcher(this.workingDir);

    this.initialized = true;
    console.error('[AgentManager] All agents initialized successfully');
  }

  /**
   * Execute a tool (route to appropriate agent)
   */
  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.error(`[AgentManager] Executing tool: ${toolName}`);

    switch (toolName) {
      // Router
      case 'analyze_task_complexity':
        return await this.router.analyzeComplexity(args.task as string);

      // MetaCoordinator
      case 'route_task':
        return await this.metaCoordinator.route(
          args.task as string,
          args.complexity as any,
          args.forceAgent as any
        );

      // OllamaSpecialist
      case 'execute_simple_task':
        return await this.ollamaSpecialist.execute(args.task as string);

      // ClaudeSpecialist
      case 'execute_complex_task':
        return await this.claudeSpecialist.execute(args.task as string);

      // Critic
      case 'review_code':
        return await this.critic.review(
          args.code as string,
          args.filePath as string,
          args.task as string
        );

      // Architect
      case 'analyze_architecture':
        return await this.architect.analyzeProject();

      case 'get_architectural_guidance':
        return await this.architect.getGuidance(args.task as string);

      // RepairAgent
      case 'repair_code':
        return await this.repairAgent.repair(
          args.review as any,
          args.originalCode as string,
          args.filePath as string
        );

      // AutoDebug
      case 'analyze_error':
        return await this.autoDebug.analyzeFailure(args.error as any);

      // LogicArchivist
      case 'document_code':
        return await this.logicArchivist.documentFile(args.filePath as string);

      // DependencyScout
      case 'analyze_dependencies':
        return await this.dependencyScout.analyzeDependencies();

      // DataExtractor
      case 'extract_data':
        return await this.dataExtractor.extract(
          args.content as string,
          args.extractionType as any
        );

      // PerformanceMonitor
      case 'get_performance_metrics':
        return await this.performanceMonitor.getMetrics();

      // RoutingOptimizer
      case 'optimize_routing':
        return await this.routingOptimizer.analyzePatterns();

      // SessionManager
      case 'start_session':
        return await this.sessionManager.startSession();

      case 'end_session':
        return await this.sessionManager.endSession();

      // Logger
      case 'get_recent_logs':
        return await this.logger.getRecentActivity(args.limit as number || 10);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.error('[AgentManager] Cleaning up resources...');
    // Add any cleanup logic here (close file handles, etc.)
    this.initialized = false;
    AgentManager.instance = null;
  }
}
```

### Bash Verification Loop (Ralph Wiggum Rail)
**Max Iterations: 5**

Create and run: `verify-wp3.sh`

```bash
#!/bin/bash

ITERATION=0
MAX_ITERATIONS=5
ERRORS=()

echo "=== Work Package 3 Verification ==="

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  echo "Iteration $ITERATION of $MAX_ITERATIONS"
  ERRORS=()
  
  # Check 1: File exists
  if [ ! -f "mcp-server/agent-manager.ts" ]; then
    ERRORS+=("mcp-server/agent-manager.ts does not exist")
    touch mcp-server/agent-manager.ts
  fi
  
  # Check 2: TypeScript syntax
  if [ -f "mcp-server/agent-manager.ts" ]; then
    if ! npx tsc --noEmit mcp-server/agent-manager.ts 2>/dev/null; then
      ERRORS+=("TypeScript syntax errors in agent-manager.ts")
    fi
  fi
  
  # Check 3: Required imports
  if [ -f "mcp-server/agent-manager.ts" ]; then
    REQUIRED_IMPORTS=(
      "StateManager"
      "Logger"
      "Router"
      "MetaCoordinator"
      "OllamaSpecialist"
      "ClaudeSpecialist"
      "Critic"
      "Architect"
    )
    
    for import_name in "${REQUIRED_IMPORTS[@]}"; do
      if ! grep -q "import.*$import_name" mcp-server/agent-manager.ts; then
        ERRORS+=("Missing import: $import_name")
      fi
    done
  fi
  
  # Check 4: AgentManager class exists
  if [ -f "mcp-server/agent-manager.ts" ]; then
    if ! grep -q "export class AgentManager" mcp-server/agent-manager.ts; then
      ERRORS+=("AgentManager class not exported")
    fi
    
    if ! grep -q "async initialize()" mcp-server/agent-manager.ts; then
      ERRORS+=("initialize method missing")
    fi
    
    if ! grep -q "async executeTool" mcp-server/agent-manager.ts; then
      ERRORS+=("executeTool method missing")
    fi
    
    if ! grep -q "async cleanup()" mcp-server/agent-manager.ts; then
      ERRORS+=("cleanup method missing")
    fi
  fi
  
  # Check 5: Singleton pattern
  if [ -f "mcp-server/agent-manager.ts" ]; then
    if ! grep -q "private static instance" mcp-server/agent-manager.ts; then
      ERRORS+=("Singleton instance field missing")
    fi
    
    if ! grep -q "static getInstance" mcp-server/agent-manager.ts; then
      ERRORS+=("getInstance method missing")
    fi
  fi
  
  # Success condition
  if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "✓ All checks passed!"
    echo "✓ AgentManager class is properly implemented"
    echo "✓ All required agents are imported"
    echo "✓ Singleton pattern is implemented"
    exit 0
  fi
  
  # Display errors
  echo "✗ Errors found:"
  for error in "${ERRORS[@]}"; do
    echo "  - $error"
  done
  
  if [ $ITERATION -eq $MAX_ITERATIONS ]; then
    break
  fi
  
  echo "Attempting fixes..."
  echo ""
done

echo "✗ Failed after $MAX_ITERATIONS iterations"
echo "Please provide error log to Lead Architect for review"
exit 1
```

**Run with:**
```bash
chmod +x verify-wp3.sh
./verify-wp3.sh
```

### Definition of Done (DoD)

- [ ] `mcp-server/agent-manager.ts` exists
- [ ] AgentManager class is exported
- [ ] Singleton pattern implemented (getInstance method)
- [ ] All 19 agents are imported and initialized
- [ ] executeTool method routes to all agents
- [ ] initialize() method sets up all dependencies
- [ ] cleanup() method exists for resource disposal
- [ ] TypeScript compiles with no errors
- [ ] Verification script passes
- [ ] CHANGELOG-WP3.md documents implementation

### Deliverables
Return to Lead Architect:
1. Complete `mcp-server/agent-manager.ts` file
2. Output of TypeScript compilation check
3. Output of verification script
4. CHANGELOG-WP3.md

---

## WORK PACKAGE 4: Create MCP Tool Definitions for Router & MetaCoordinator

### Objective
Define the MCP tool schemas for Router and MetaCoordinator agents in the tools.ts file.

### Prerequisites
- Work Packages 1-3 completed
- Understanding of MCP tool schema format
- Knowledge of Router and MetaCoordinator agent capabilities

### Tasks
1. Create `mcp-server/types.ts` with shared type definitions
2. Implement tool definitions in `mcp-server/tools.ts`
3. Define schemas for Router and MetaCoordinator tools

### Detailed Instructions for Local Agent

#### Implementation: mcp-server/types.ts

```typescript
/**
 * Shared type definitions for MCP server
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: unknown;
    }>;
    required: string[];
  };
}
```

#### Implementation: mcp-server/tools.ts

```typescript
/**
 * MCP Tool Definitions for all 19 agents
 */

import { MCPToolDefinition } from './types.js';

export const AGENT_TOOLS: MCPToolDefinition[] = [
  // ========================================
  // Router Agent Tools
  // ========================================
  {
    name: 'analyze_task_complexity',
    description: 'Analyze a task and determine its complexity level (simple/medium/complex). Returns complexity classification, score (0-100), and contributing factors.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task description to analyze for complexity',
        },
      },
      required: ['task'],
    },
  },

  // ========================================
  // MetaCoordinator Agent Tools
  // ========================================
  {
    name: 'route_task',
    description: 'Route a task to the appropriate execution agent (Ollama for simple tasks, Claude for complex tasks). Uses token budget and complexity analysis to make routing decisions.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task to route to an execution agent',
        },
        complexity: {
          type: 'string',
          description: 'Task complexity from Router agent',
          enum: ['simple', 'medium', 'complex'],
        },
        forceAgent: {
          type: 'string',
          description: 'Optional: Force routing to specific agent (bypasses normal routing logic)',
          enum: ['ollama-specialist', 'claude-specialist'],
        },
      },
      required: ['task', 'complexity'],
    },
  },
];
```

### Bash Verification Loop (Ralph Wiggum Rail)
**Max Iterations: 5**

Create and run: `verify-wp4.sh`

```bash
#!/bin/bash

ITERATION=0
MAX_ITERATIONS=5
ERRORS=()

echo "=== Work Package 4 Verification ==="

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  echo "Iteration $ITERATION of $MAX_ITERATIONS"
  ERRORS=()
  
  # Check 1: Files exist
  if [ ! -f "mcp-server/types.ts" ]; then
    ERRORS+=("mcp-server/types.ts missing")
  fi
  
  if [ ! -f "mcp-server/tools.ts" ]; then
    ERRORS+=("mcp-server/tools.ts missing")
  fi
  
  # Check 2: TypeScript syntax
  if [ -f "mcp-server/types.ts" ]; then
    if ! npx tsc --noEmit mcp-server/types.ts 2>/dev/null; then
      ERRORS+=("TypeScript errors in types.ts")
    fi
  fi
  
  if [ -f "mcp-server/tools.ts" ]; then
    if ! npx tsc --noEmit mcp-server/tools.ts 2>/dev/null; then
      ERRORS+=("TypeScript errors in tools.ts")
    fi
  fi
  
  # Check 3: Required exports in types.ts
  if [ -f "mcp-server/types.ts" ]; then
    if ! grep -q "export interface MCPToolDefinition" mcp-server/types.ts; then
      ERRORS+=("MCPToolDefinition interface not exported")
    fi
  fi
  
  # Check 4: Required exports in tools.ts
  if [ -f "mcp-server/tools.ts" ]; then
    if ! grep -q "export const AGENT_TOOLS" mcp-server/tools.ts; then
      ERRORS+=("AGENT_TOOLS not exported")
    fi
  fi
  
  # Check 5: Tool definitions exist
  if [ -f "mcp-server/tools.ts" ]; then
    if ! grep -q "analyze_task_complexity" mcp-server/tools.ts; then
      ERRORS+=("analyze_task_complexity tool missing")
    fi
    
    if ! grep -q "route_task" mcp-server/tools.ts; then
      ERRORS+=("route_task tool missing")
    fi
  fi
  
  # Check 6: Tool schema structure
  if [ -f "mcp-server/tools.ts" ]; then
    TOOL_COUNT=$(grep -c '"name":' mcp-server/tools.ts)
    if [ "$TOOL_COUNT" -lt 2 ]; then
      ERRORS+=("Expected at least 2 tools, found $TOOL_COUNT")
    fi
  fi
  
  # Success
  if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "✓ All checks passed!"
    echo "✓ Tool definitions are valid"
    echo "✓ Type definitions exported"
    exit 0
  fi
  
  # Display errors
  echo "✗ Errors found:"
  for error in "${ERRORS[@]}"; do
    echo "  - $error"
  done
  
  if [ $ITERATION -eq $MAX_ITERATIONS ]; then
    break
  fi
  
  echo ""
done

echo "✗ Failed after $MAX_ITERATIONS iterations"
exit 1
```

**Run with:**
```bash
chmod +x verify-wp4.sh
./verify-wp4.sh
```

### Definition of Done (DoD)

- [ ] `mcp-server/types.ts` exists and exports MCPToolDefinition interface
- [ ] `mcp-server/tools.ts` exists and exports AGENT_TOOLS array
- [ ] `analyze_task_complexity` tool is defined with proper schema
- [ ] `route_task` tool is defined with proper schema
- [ ] All tool schemas include name, description, and inputSchema
- [ ] TypeScript compiles with no errors
- [ ] Verification script passes
- [ ] CHANGELOG-WP4.md documents implementation

### Deliverables
Return to Lead Architect:
1. Complete `mcp-server/types.ts` and `mcp-server/tools.ts` files
2. Output of TypeScript compilation
3. Output of verification script
4. CHANGELOG-WP4.md

---

## REMAINING WORK PACKAGES (Overview)

The following work packages follow the same structure. Each will:
- Have detailed implementation instructions
- Include a Ralph Wiggum verification script (max 5 iterations)
- Provide clear Definition of Done criteria
- Require deliverables back to Lead Architect

### WP5: Execution Agents Tools (Ollama & Claude)
### WP6: Quality Agents Tools (Critic, Architect, Repair)
### WP7: Support Agents Tools (Logger, AutoDebug, etc.)
### WP8: MCP Resources (Logs, State Files)
### WP9: OpenCode Configuration
### WP10: Integration Testing

---

## HANDOFF PROTOCOL

### When Returning Work to Lead Architect

For each work package, provide:

1. **Success Status**: Pass/Fail
2. **Verification Output**: Complete output of verification script
3. **All Code Files**: Complete files created/modified
4. **TypeScript Compilation**: Output of `npx tsc --noEmit`
5. **Changelog**: CHANGELOG-WPX.md documenting changes
6. **Error Log** (if failed): Complete error output from final iteration

### Format for Error Reporting (if max iterations reached)

```
WORK PACKAGE: [Number]
STATUS: FAILED
ITERATIONS: 5/5
FINAL ERRORS:
- [Error 1]
- [Error 2]

ERROR LOG:
[Complete console output]

ATTEMPTED FIXES:
- [What you tried]
```

---

## NOTES FOR LOCAL AGENT

1. **Always run verification script after implementation**
2. **Max 5 iterations on verification loop**
3. **Document ANY deviations from spec in changelog**
4. **If stuck, return to Lead Architect - don't struggle past iteration 5**
5. **Test TypeScript compilation before calling verification complete**

---

## PROJECT STATUS TRACKING

| WP  | Status  | Agent Assigned | Date Started | Date Completed |
|-----|---------|----------------|--------------|----------------|
| WP1 | Pending | -              | -            | -              |
| WP2 | Pending | -              | -            | -              |
| WP3 | Pending | -              | -            | -              |
| WP4 | Pending | -              | -            | -              |
| WP5 | Pending | -              | -            | -              |
| WP6 | Pending | -              | -            | -              |
| WP7 | Pending | -              | -            | -              |
| WP8 | Pending | -              | -            | -              |
| WP9 | Pending | -              | -            | -              |
| WP10| Pending | -              | -            | -              |

---

**Lead Architect**: Ready to review WP1 deliverables when Local Agent completes.
