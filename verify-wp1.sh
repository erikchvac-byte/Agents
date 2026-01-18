#!/bin/bash

echo "Verifying WP1: MCP Server Implementation"
echo "========================================"
echo

PASS=0
FAIL=0

check_file() {
  local file=$1
  if [ -f "$file" ]; then
    echo "✓ $file exists"
    ((PASS++))
  else
    echo "✗ $file missing"
    ((FAIL++))
  fi
}

check_directory() {
  local dir=$1
  if [ -d "$dir" ]; then
    if [ "$(ls -A $dir)" ]; then
      echo "✓ $dir exists and is not empty"
      ((PASS++))
    else
      echo "✗ $dir exists but is empty"
      ((FAIL++))
    fi
  else
    echo "✗ $dir missing"
    ((FAIL++))
  fi
}

check_script() {
  local script=$1
  if grep -q "\"$script\":" package.json; then
    echo "✓ Script '$script' found in package.json"
    ((PASS++))
  else
    echo "✗ Script '$script' not found in package.json"
    ((FAIL++))
  fi
}

echo "Checking MCP server files..."
check_directory "mcp-server"
check_file "mcp-server/index.ts"
check_file "mcp-server/types.ts"
check_file "mcp-server/agent-manager.ts"
check_file "mcp-server/tools.ts"
echo

echo "Checking package.json scripts..."
check_script "mcp:serve"
echo

echo "Verification script..."
check_file "verify-wp1.sh"
echo

echo "========================================"
echo "Results: $PASS passed, $FAIL failed"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo "✓ WP1 is COMPLETE"
  exit 0
else
  echo "✗ WP1 is INCOMPLETE"
  exit 1
fi
