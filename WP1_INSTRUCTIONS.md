# WORK PACKAGE 1: Install MCP SDK and Setup Project Structure

**⚠️ IMPORTANT FOR LOCAL AGENT: When verification passes, IMMEDIATELY stop and create deliverables file. Do NOT proceed to WP2.**

---

## Objective
Install the Model Context Protocol SDK and create the basic directory structure for the MCP server.

## Prerequisites
- Node.js and npm installed
- Access to C:\Users\erikc\Dev\Agents directory
- Internet connection for npm package installation

---

## EXECUTION STEPS

### Step 1: Install MCP SDK
```bash
npm install @modelcontextprotocol/sdk --save
```

### Step 2: Create directory structure
```bash
mkdir -p mcp-server
touch mcp-server/index.ts
touch mcp-server/types.ts
touch mcp-server/agent-manager.ts
touch mcp-server/tools.ts
```

### Step 3: Update package.json
Add this script to the `"scripts"` section of package.json:
```json
"mcp:serve": "node --loader ts-node/esm mcp-server/index.ts"
```

### Step 4: Create verification script
```bash
cat > verify-wp1.sh << 'EOF'
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
    echo ""
    echo "=========================================="
    echo "WORK PACKAGE 1 COMPLETE!"
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
echo ""
echo "=========================================="
echo "WORK PACKAGE 1 FAILED"
echo "=========================================="
echo ""
echo "Create error report in WP1_DELIVERABLES.md"
exit 1
EOF

chmod +x verify-wp1.sh
```

### Step 5: Run verification
```bash
./verify-wp1.sh
```

---

## WHEN VERIFICATION PASSES - STOP AND CREATE DELIVERABLES

**🛑 CRITICAL: When verify-wp1.sh shows "WORK PACKAGE 1 COMPLETE!", do the following:**

### Create deliverables file:

```bash
cat > WP1_DELIVERABLES.md << 'DELIVERABLES_EOF'
# Work Package 1 - Deliverables Report

**Date Completed:** $(date)
**Status:** PASS

---

## 1. MCP SDK Installation Verification

DELIVERABLES_EOF

echo '```bash' >> WP1_DELIVERABLES.md
npm list @modelcontextprotocol/sdk >> WP1_DELIVERABLES.md
echo '```' >> WP1_DELIVERABLES.md
echo '' >> WP1_DELIVERABLES.md

cat >> WP1_DELIVERABLES.md << 'DELIVERABLES_EOF'

---

## 2. Directory Structure

```bash
DELIVERABLES_EOF

ls -la mcp-server/ >> WP1_DELIVERABLES.md

cat >> WP1_DELIVERABLES.md << 'DELIVERABLES_EOF'
```

---

## 3. Package.json Scripts Section

```bash
DELIVERABLES_EOF

grep -A 10 '"scripts"' package.json >> WP1_DELIVERABLES.md

cat >> WP1_DELIVERABLES.md << 'DELIVERABLES_EOF'
```

---

## 4. Verification Script Results

✓ All checks passed!
Iterations used: See above

---

## 5. Changes Made

- [x] No deviations - implemented exactly as specified

---

## ✅ WORK PACKAGE 1 COMPLETE

**Local Agent has stopped execution.**

Please return this file to Lead Architect for review.
DELIVERABLES_EOF

echo ""
echo "=========================================="
echo "DELIVERABLES FILE CREATED!"
echo "=========================================="
echo ""
echo "File location: WP1_DELIVERABLES.md"
echo ""
echo "🛑 STOP HERE - Do not proceed to WP2"
echo "   Return WP1_DELIVERABLES.md to human user"
echo "   Wait for Lead Architect approval"
```

---

## Definition of Done (DoD)

- [ ] `@modelcontextprotocol/sdk` package is installed
- [ ] `mcp-server/` directory exists with all 4 TypeScript files
- [ ] `npm run mcp:serve` script exists in package.json
- [ ] Verification script passes with 0 errors
- [ ] WP1_DELIVERABLES.md file created

---

## IF VERIFICATION FAILS AFTER 5 ITERATIONS

Create error report:

```bash
cat > WP1_DELIVERABLES.md << 'EOF'
# Work Package 1 - Deliverables Report

**Date:** $(date)
**Status:** FAILED
**Iterations:** 5/5

## Error Log

[Paste complete error output from verify-wp1.sh here]

## Attempted Fixes

[Describe what was attempted]

## Request

Local Agent requests Lead Architect assistance.
EOF

echo "Error report created: WP1_DELIVERABLES.md"
echo "STOP - Return to human user for Lead Architect review"
```

---

## 🎯 SUMMARY FOR LOCAL AGENT

1. ✅ Execute Steps 1-5
2. ✅ When verification passes, create WP1_DELIVERABLES.md
3. 🛑 **STOP** - Do NOT continue to WP2
4. 📤 Return WP1_DELIVERABLES.md to human user
5. ⏸️ Wait for Lead Architect (Claude) to review and approve
