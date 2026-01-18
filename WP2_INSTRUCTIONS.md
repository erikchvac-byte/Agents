# WORK PACKAGE 2: Create MCP Server Entry Point with Stdio Transport

**⚠️ IMPORTANT FOR LOCAL AGENT: When verification passes, IMMEDIATELY stop and create deliverables file. Do NOT proceed to WP3.**

---

## Objective
Implement the main MCP server file (index.ts) that sets up stdio transport and handles the MCP protocol.

## Prerequisites
- Work Package 1 completed successfully
- Understanding of TypeScript async/await patterns
- Familiarity with Node.js stdio streams

---

## EXECUTION STEPS

### Step 1: Implement mcp-server/index.ts

Create the file with the following content:

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

### Step 2: Create verification script

```bash
cat > verify-wp2.sh << 'EOF'
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
    echo ""
    echo "=========================================="
    echo "WORK PACKAGE 2 COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Next step: Create deliverables report"
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
echo ""
echo "=========================================="
echo "WORK PACKAGE 2 FAILED"
echo "=========================================="
echo ""
echo "Create error report in WP2_DELIVERABLES.md"
exit 1
EOF

chmod +x verify-wp2.sh
```

### Step 3: Run verification
```bash
./verify-wp2.sh
```

---

## WHEN VERIFICATION PASSES - STOP AND CREATE DELIVERABLES

**🛑 CRITICAL: When verify-wp2.sh shows "WORK PACKAGE 2 COMPLETE!", do the following:**

### Create deliverables file:

```bash
cat > WP2_DELIVERABLES.md << 'DELIVERABLES_EOF'
# Work Package 2 - Deliverables Report

**Date Completed:** $(date)
**Status:** PASS

---

## 1. File Implementation

Created: mcp-server/index.ts

✓ File contains AgentMCPServer class
✓ File has shebang (#!/usr/bin/env node)
✓ All required imports present
✓ Stdio transport configured
✓ Error handling implemented
✓ Graceful shutdown handlers present

---

## 2. TypeScript Compilation Check

DELIVERABLES_EOF

echo '```bash' >> WP2_DELIVERABLES.md
npx tsc --noEmit mcp-server/index.ts 2>&1 >> WP2_DELIVERABLES.md
echo '```' >> WP2_DELIVERABLES.md
echo '' >> WP2_DELIVERABLES.md

cat >> WP2_DELIVERABLES.md << 'DELIVERABLES_EOF'

---

## 3. Verification Script Results

✓ All checks passed!
✓ File structure is correct
✓ TypeScript syntax is valid
✓ Required imports present

---

## 4. File Contents

```typescript
DELIVERABLES_EOF

cat mcp-server/index.ts >> WP2_DELIVERABLES.md

cat >> WP2_DELIVERABLES.md << 'DELIVERABLES_EOF'
```

---

## 5. Changes Made

- [x] Implemented mcp-server/index.ts exactly as specified
- [x] No deviations from specification

---

## 6. Notes

- This file won't run yet because AgentManager and AGENT_TOOLS don't exist
- This is expected and correct
- Structure and TypeScript syntax have been verified
- End-to-end testing will happen in WP10

---

## ✅ WORK PACKAGE 2 COMPLETE

**Local Agent has stopped execution.**

Please return this file to Lead Architect for review.
DELIVERABLES_EOF

echo ""
echo "=========================================="
echo "DELIVERABLES FILE CREATED!"
echo "=========================================="
echo ""
echo "File location: WP2_DELIVERABLES.md"
echo ""
echo "🛑 STOP HERE - Do not proceed to WP3"
echo "   Return WP2_DELIVERABLES.md to human user"
echo "   Wait for Lead Architect approval"
```

---

## Definition of Done (DoD)

- [ ] `mcp-server/index.ts` exists and contains AgentMCPServer class
- [ ] File has proper shebang (`#!/usr/bin/env node`)
- [ ] All required imports from MCP SDK are present
- [ ] TypeScript compiles with no syntax errors
- [ ] Code includes stdio transport setup
- [ ] Error handling for tool execution is implemented
- [ ] Graceful shutdown handlers (SIGINT, SIGTERM) are present
- [ ] Verification script passes with 0 errors
- [ ] WP2_DELIVERABLES.md file created

---

## IF VERIFICATION FAILS AFTER 5 ITERATIONS

Create error report:

```bash
cat > WP2_DELIVERABLES.md << 'EOF'
# Work Package 2 - Deliverables Report

**Date:** $(date)
**Status:** FAILED
**Iterations:** 5/5

## Error Log

[Paste complete error output from verify-wp2.sh here]

## Attempted Fixes

[Describe what was attempted]

## TypeScript Errors

[Paste output of: npx tsc --noEmit mcp-server/index.ts]

## Request

Local Agent requests Lead Architect assistance.
EOF

echo "Error report created: WP2_DELIVERABLES.md"
echo "STOP - Return to human user for Lead Architect review"
```

---

## 🎯 SUMMARY FOR LOCAL AGENT

1. ✅ Execute Steps 1-3
2. ✅ When verification passes, create WP2_DELIVERABLES.md
3. 🛑 **STOP** - Do NOT continue to WP3
4. 📤 Return WP2_DELIVERABLES.md to human user
5. ⏸️ Wait for Lead Architect (Claude) to review and approve
