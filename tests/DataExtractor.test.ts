import { DataExtractor } from '../agents/DataExtractor';
import { StateManager } from '../state/StateManager';
import { Logger } from '../agents/Logger';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('DataExtractor Agent', () => {
  let dataExtractor: DataExtractor;
  let stateManager: StateManager;
  let logger: Logger;
  let tempDir: string;
  let testCodeDir: string;

  beforeEach(async () => {
    // Create temp directory for test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dataextractor-test-'));
    testCodeDir = path.join(tempDir, 'code');

    const stateDir = path.join(tempDir, 'state');
    const logsDir = path.join(tempDir, 'logs');

    await fs.mkdir(stateDir, { recursive: true });
    await fs.mkdir(logsDir, { recursive: true });
    await fs.mkdir(testCodeDir, { recursive: true });

    stateManager = new StateManager(stateDir);
    logger = new Logger(logsDir);
    dataExtractor = new DataExtractor(stateManager, logger, tempDir);
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('extractContext', () => {
    test('should extract context from TypeScript files', async () => {
      // Create sample TypeScript file
      const sampleCode = `
export interface User {
  id: string;
  name: string;
  email: string;
}

export function getUserById(id: string): User | null {
  return null;
}

export const createUser = async (name: string, email: string): Promise<User> => {
  return { id: '1', name, email };
};
      `;

      await fs.writeFile(path.join(testCodeDir, 'user.ts'), sampleCode);

      const result = await dataExtractor.extractContext('code', true);

      expect(result.success).toBe(true);
      expect(result.filesAnalyzed).toBe(1);
      expect(result.context).not.toBeNull();

      if (result.context) {
        expect(result.context.functions.length).toBeGreaterThan(0);
        expect(result.context.types.length).toBeGreaterThan(0);

        // Check for User interface
        const userInterface = result.context.types.find(t => t.name === 'User');
        expect(userInterface).toBeDefined();
        expect(userInterface?.kind).toBe('interface');
        expect(userInterface?.isExported).toBe(true);

        // Check for functions
        const getUserFn = result.context.functions.find(f => f.name === 'getUserById');
        expect(getUserFn).toBeDefined();
        expect(getUserFn?.isExported).toBe(true);

        const createUserFn = result.context.functions.find(f => f.name === 'createUser');
        expect(createUserFn).toBeDefined();
        expect(createUserFn?.isAsync).toBe(true);
      }
    });

    test('should handle empty directories', async () => {
      const emptyDir = path.join(testCodeDir, 'empty');
      await fs.mkdir(emptyDir);

      const result = await dataExtractor.extractContext('code/empty', true);

      expect(result.success).toBe(true);
      expect(result.filesAnalyzed).toBe(0);
      expect(result.context?.functions).toHaveLength(0);
    });

    test('should extract from multiple files', async () => {
      // Create multiple files
      await fs.writeFile(
        path.join(testCodeDir, 'file1.ts'),
        'export function func1() { return 1; }'
      );

      await fs.writeFile(
        path.join(testCodeDir, 'file2.ts'),
        'export function func2() { return 2; }'
      );

      const result = await dataExtractor.extractContext('code', true);

      expect(result.success).toBe(true);
      expect(result.filesAnalyzed).toBe(2);
      expect(result.context?.functions.length).toBeGreaterThanOrEqual(2);
    });

    test('should extract imports and exports', async () => {
      const sampleCode = `
import { User } from './types';
import * as path from 'path';

export { User };
export const API_VERSION = '1.0';
      `;

      await fs.writeFile(path.join(testCodeDir, 'exports.ts'), sampleCode);

      const result = await dataExtractor.extractContext('code', true);

      expect(result.success).toBe(true);
      expect(result.context?.imports.length).toBeGreaterThan(0);
      expect(result.context?.exports.length).toBeGreaterThan(0);
    });

    test('should skip node_modules', async () => {
      const nodeModulesDir = path.join(testCodeDir, 'node_modules');
      await fs.mkdir(nodeModulesDir);

      await fs.writeFile(
        path.join(nodeModulesDir, 'package.ts'),
        'export function packageFunc() {}'
      );

      await fs.writeFile(
        path.join(testCodeDir, 'app.ts'),
        'export function appFunc() {}'
      );

      const result = await dataExtractor.extractContext('code', true);

      expect(result.success).toBe(true);
      expect(result.filesAnalyzed).toBe(1); // Should only analyze app.ts
      expect(result.context?.functions.find(f => f.name === 'packageFunc')).toBeUndefined();
    });

    test('should handle non-recursive extraction', async () => {
      const subDir = path.join(testCodeDir, 'sub');
      await fs.mkdir(subDir);

      await fs.writeFile(path.join(testCodeDir, 'top.ts'), 'export function top() {}');
      await fs.writeFile(path.join(subDir, 'sub.ts'), 'export function sub() {}');

      const result = await dataExtractor.extractContext('code', false);

      expect(result.success).toBe(true);
      expect(result.filesAnalyzed).toBe(1); // Should only analyze top.ts
    });
  });

  describe('extractAPIs', () => {
    test('should extract APIs from specific files', async () => {
      const apiCode = `
export interface APIResponse {
  status: number;
  data: any;
}

export async function fetchData(url: string): Promise<APIResponse> {
  return { status: 200, data: {} };
}
      `;

      const filePath = path.join(testCodeDir, 'api.ts');
      await fs.writeFile(filePath, apiCode);

      const result = await dataExtractor.extractAPIs(['code/api.ts']);

      expect(result.functions.length).toBeGreaterThan(0);
      expect(result.types.length).toBeGreaterThan(0);

      const fetchFn = result.functions.find(f => f.name === 'fetchData');
      expect(fetchFn).toBeDefined();
      expect(fetchFn?.isAsync).toBe(true);

      const apiType = result.types.find(t => t.name === 'APIResponse');
      expect(apiType).toBeDefined();
    });

    test('should handle missing files gracefully', async () => {
      const result = await dataExtractor.extractAPIs(['code/nonexistent.ts', 'code/missing.ts']);

      expect(result.functions).toHaveLength(0);
      expect(result.types).toHaveLength(0);
    });
  });

  describe('generateSummary', () => {
    test('should generate readable summary', async () => {
      const sampleCode = `
export interface Config {
  port: number;
  host: string;
}

export function loadConfig(): Config {
  return { port: 3000, host: 'localhost' };
}
      `;

      await fs.writeFile(path.join(testCodeDir, 'config.ts'), sampleCode);

      const extractResult = await dataExtractor.extractContext('code', true);

      expect(extractResult.context).not.toBeNull();

      if (extractResult.context) {
        const summary = dataExtractor.generateSummary(extractResult.context);

        expect(summary).toContain('Codebase Context Summary');
        expect(summary).toContain('Functions');
        expect(summary).toContain('Types');
      }
    });

    test('should limit summary to top 10 items', async () => {
      // Create file with many functions
      const functions = Array.from({ length: 15 }, (_, i) => `export function func${i}() {}`).join('\n');

      await fs.writeFile(path.join(testCodeDir, 'many.ts'), functions);

      const extractResult = await dataExtractor.extractContext('code', true);

      if (extractResult.context) {
        const summary = dataExtractor.generateSummary(extractResult.context);

        expect(summary).toContain('and 5 more');
      }
    });

    test('should include patterns in summary', async () => {
      const asyncCode = `
export async function fetch1() {}
export async function fetch2() {}
export async function fetch3() {}
export async function fetch4() {}
export async function fetch5() {}
export async function fetch6() {}
      `;

      await fs.writeFile(path.join(testCodeDir, 'async.ts'), asyncCode);

      const extractResult = await dataExtractor.extractContext('code', true);

      if (extractResult.context) {
        const summary = dataExtractor.generateSummary(extractResult.context);

        expect(summary).toContain('Code Patterns');
        expect(summary).toContain('Async/Await Pattern');
      }
    });
  });

  describe('pattern identification', () => {
    test('should identify async/await pattern', async () => {
      const asyncCode = `
export async function task1() {}
export async function task2() {}
export async function task3() {}
      `;

      await fs.writeFile(path.join(testCodeDir, 'async.ts'), asyncCode);

      const result = await dataExtractor.extractContext('code', true);

      expect(result.context?.patterns.some(p => p.name === 'Async/Await Pattern')).toBe(true);
    });

    test('should identify interface-driven design', async () => {
      const interfaces = Array.from(
        { length: 6 },
        (_, i) => `export interface Type${i} { field: string; }`
      ).join('\n');

      await fs.writeFile(path.join(testCodeDir, 'types.ts'), interfaces);

      const result = await dataExtractor.extractContext('code', true);

      expect(result.context?.patterns.some(p => p.name === 'Interface-Driven Design')).toBe(true);
    });

    test('should identify class-based architecture', async () => {
      const classes = Array.from(
        { length: 6 },
        (_, i) => `export class Class${i} { method() {} }`
      ).join('\n');

      await fs.writeFile(path.join(testCodeDir, 'classes.ts'), classes);

      const result = await dataExtractor.extractContext('code', true);

      expect(result.context?.patterns.some(p => p.name === 'Object-Oriented Architecture')).toBe(
        true
      );
    });
  });

  describe('type extraction', () => {
    test('should extract type aliases', async () => {
      const typeCode = `
export type Status = 'active' | 'inactive';
export type ID = string | number;
      `;

      await fs.writeFile(path.join(testCodeDir, 'types.ts'), typeCode);

      const result = await dataExtractor.extractContext('code', true);

      expect(result.context?.types.length).toBeGreaterThanOrEqual(2);

      const statusType = result.context?.types.find(t => t.name === 'Status');
      expect(statusType).toBeDefined();
      expect(statusType?.kind).toBe('type');
    });

    test('should extract classes', async () => {
      const classCode = `
export class UserService {
  constructor() {}

  getUser(id: string) {
    return null;
  }
}
      `;

      await fs.writeFile(path.join(testCodeDir, 'service.ts'), classCode);

      const result = await dataExtractor.extractContext('code', true);

      const userServiceClass = result.context?.types.find(t => t.name === 'UserService');
      expect(userServiceClass).toBeDefined();
      expect(userServiceClass?.kind).toBe('class');
    });
  });

  describe('performance', () => {
    test('should extract quickly from small codebase', async () => {
      await fs.writeFile(path.join(testCodeDir, 'small.ts'), 'export function small() {}');

      const result = await dataExtractor.extractContext('code', true);

      expect(result.duration_ms).toBeLessThan(200);
    });

    test('should handle large files efficiently', async () => {
      // Create a large file
      const largeCode = Array.from({ length: 100 }, (_, i) => `export function func${i}() {}`).join(
        '\n'
      );

      await fs.writeFile(path.join(testCodeDir, 'large.ts'), largeCode);

      const result = await dataExtractor.extractContext('code', true);

      expect(result.success).toBe(true);
      expect(result.duration_ms).toBeLessThan(500);
    });
  });

  describe('edge cases', () => {
    test('should handle invalid directory path', async () => {
      const result = await dataExtractor.extractContext('nonexistent', true);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle files with no exports', async () => {
      await fs.writeFile(
        path.join(testCodeDir, 'private.ts'),
        'function privateFunc() { return 1; }'
      );

      const result = await dataExtractor.extractContext('code', true);

      expect(result.success).toBe(true);
    });

    test('should handle mixed JS and TS files', async () => {
      await fs.writeFile(path.join(testCodeDir, 'file.ts'), 'export function tsFunc() {}');
      await fs.writeFile(path.join(testCodeDir, 'file.js'), 'export function jsFunc() {}');

      const result = await dataExtractor.extractContext('code', true);

      expect(result.success).toBe(true);
      expect(result.filesAnalyzed).toBe(2);
    });
  });
});
