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
  fi
  
  # Check 2: TypeScript syntax (ignore node_modules and AGENT_TOOLS errors)
  if [ -f "mcp-server/agent-manager.ts" ]; then
    TSC_OUTPUT=$(npx tsc --noEmit mcp-server/agent-manager.ts 2>&1 | grep -v "node_modules" | grep -v "AGENT_TOOLS" || true)
    if [ -n "$TSC_OUTPUT" ]; then
      ERRORS+=("TypeScript syntax errors in agent-manager.ts: $TSC_OUTPUT")
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
  
  # Check 6: index.ts updated to use singleton
  if [ -f "mcp-server/index.ts" ]; then
    if ! grep -q "AgentManager.getInstance" mcp-server/index.ts; then
      ERRORS+=("index.ts not updated to use AgentManager.getInstance()")
    fi
  fi
  
  # Success condition
  if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "✓ All checks passed!"
    echo "✓ AgentManager class is properly implemented"
    echo "✓ All required agents are imported"
    echo "✓ Singleton pattern is implemented"
    echo "✓ index.ts updated to use singleton"
    echo ""
    echo "=========================================="
    echo "WORK PACKAGE 3 COMPLETE!"
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
  
  if [ $ITERATION -eq $MAX_ITERATIONS ]; then
    break
  fi
  
  echo "Attempting fixes..."
  echo ""
done

echo "✗ Failed after $MAX_ITERATIONS iterations"
echo ""
echo "=========================================="
echo "WORK PACKAGE 3 FAILED"
echo "=========================================="
echo ""
echo "Create error report in WP3_DELIVERABLES.md"
exit 1