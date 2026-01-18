import { ExecutionResult, GeneratedFile } from '../state/schemas';
import { promises as fs } from 'fs';

export interface VerificationResult {
  passed: boolean;
  error?: string;
}

export async function verifyOllamaResponse(result: ExecutionResult, durationMs?: number): Promise<VerificationResult> {
  if (!result.success) {
    return { passed: false, error: 'Execution failed' };
  }

  if (!result.output || result.output.trim().length === 0) {
    return { passed: false, error: 'Empty output' };
  }

  if (result.output.length > 100000) {
    return { passed: false, error: 'Output too large' };
  }

  if (durationMs && durationMs > 60000) {
    return { passed: false, error: 'Response too slow' };
  }

  return { passed: true };
}

export async function verifySyntax(code: string, language?: string): Promise<VerificationResult> {
  if (!code || code.trim().length === 0) {
    return { passed: false, error: 'Empty code' };
  }

  if (code.includes('TODO') || code.includes('FIXME')) {
    return { passed: false, error: 'Contains TODO/FIXME' };
  }

  void language;

  return { passed: true };
}

export async function verifyFileIntegrity(filePath: string): Promise<VerificationResult> {
  try {
    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      return { passed: false, error: 'Not a file' };
    }

    if (stats.size === 0) {
      return { passed: false, error: 'Empty file' };
    }

    if (stats.size > 100000) {
      return { passed: false, error: 'File too large' };
    }

    if (filePath.includes('..') || filePath.startsWith('/')) {
      return { passed: false, error: 'Invalid file path' };
    }

    return { passed: true };
  } catch (error) {
    return { passed: false, error: `File access error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function verifyGeneratedFile(file: GeneratedFile): Promise<VerificationResult> {
  if (!file.path || !file.content) {
    return { passed: false, error: 'Missing path or content' };
  }

  if (file.path.includes('..') || file.path.startsWith('/')) {
    return { passed: false, error: 'Invalid file path' };
  }

  if (file.content.length > 100000) {
    return { passed: false, error: 'File content too large' };
  }

  return { passed: true };
}
