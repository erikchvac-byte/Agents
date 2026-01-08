/**
 * File Path Parser Utility
 * Extracts target file paths from natural language task descriptions
 */

import * as path from 'path';

export interface ParsedFileInfo {
  targetPath: string | null;
  operation: 'create' | 'update';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Parse file path from task description
 *
 * Examples:
 * - "Create utils/auth.ts with OAuth" -> { targetPath: "utils/auth.ts", operation: "create", confidence: "high" }
 * - "Update src/api/users.ts to add validation" -> { targetPath: "src/api/users.ts", operation: "update", confidence: "high" }
 * - "Add a sum function" -> { targetPath: null, operation: "create", confidence: "low" }
 *
 * @param task Task description from user
 * @param workingDir Working directory for resolving relative paths
 * @returns Parsed file information
 */
export function parseFilePathFromTask(task: string, workingDir: string): ParsedFileInfo {
  const taskLower = task.toLowerCase();

  // Pattern 1: Explicit file path with extension
  const explicitPathMatch = task.match(/(?:create|update|modify|write|add to|edit)\s+([a-zA-Z0-9_\-\/\.]+\.(?:tsx|jsx|ts|js|json|md|txt))\b/i);
  if (explicitPathMatch) {
    return {
      targetPath: path.join(workingDir, explicitPathMatch[1]),
      operation: taskLower.includes('update') || taskLower.includes('modify') || taskLower.includes('edit') ? 'update' : 'create',
      confidence: 'high',
    };
  }

  // Pattern 2: File path in quotes
  const quotedPathMatch = task.match(/["']([a-zA-Z0-9_\-\/\.]+\.(?:tsx|jsx|ts|js|json|md|txt))\b["']/);
  if (quotedPathMatch) {
    return {
      targetPath: path.join(workingDir, quotedPathMatch[1]),
      operation: taskLower.includes('update') || taskLower.includes('modify') ? 'update' : 'create',
      confidence: 'high',
    };
  }

  // Pattern 3: Implied file path from function/component name
  const functionMatch = task.match(/(?:add|create)\s+(?:a\s+)?(?:function|class|component)\s+(?:called\s+)?([a-zA-Z0-9_]+)/i);
  if (functionMatch) {
    const name = functionMatch[1];
    return {
      targetPath: path.join(workingDir, 'generated', `${name}.ts`),
      operation: 'create',
      confidence: 'low',
    };
  }

  // Pattern 4: No file path detected
  return {
    targetPath: null,
    operation: 'create',
    confidence: 'low',
  };
}

/**
 * Validate that a file path is safe to write to
 * Prevents writing outside working directory or to sensitive files
 *
 * @param filePath File path to validate
 * @param workingDir Working directory root
 * @returns true if path is safe, false otherwise
 */
export function isPathSafe(filePath: string, workingDir: string): boolean {
  const normalizedPath = path.resolve(filePath);
  const normalizedWorkingDir = path.resolve(workingDir);

  // Must be within working directory
  if (!normalizedPath.startsWith(normalizedWorkingDir)) {
    return false;
  }

  // Prevent writing to sensitive files
  const sensitivePatterns = [
    /node_modules/,
    /\.git/,
    /package\.json$/,
    /package-lock\.json$/,
    /tsconfig\.json$/,
    /\.env$/,
  ];

  return !sensitivePatterns.some(pattern => pattern.test(normalizedPath));
}
