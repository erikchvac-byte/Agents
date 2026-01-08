import { parseFilePathFromTask, isPathSafe } from '../utils/filePathParser';
import * as path from 'path';

describe('filePathParser', () => {
  const workingDir = path.join('c:', 'test', 'project');

  describe('parseFilePathFromTask', () => {
    test('parses explicit file path with create', () => {
      const result = parseFilePathFromTask('Create utils/auth.ts with OAuth', workingDir);
      expect(result.targetPath).toContain('utils');
      expect(result.targetPath).toContain('auth.ts');
      expect(result.operation).toBe('create');
      expect(result.confidence).toBe('high');
    });

    test('parses explicit file path with update', () => {
      const result = parseFilePathFromTask('Update src/api/users.ts to add validation', workingDir);
      expect(result.targetPath).toContain('src');
      expect(result.targetPath).toContain('api');
      expect(result.targetPath).toContain('users.ts');
      expect(result.operation).toBe('update');
      expect(result.confidence).toBe('high');
    });

    test('parses quoted file path', () => {
      const result = parseFilePathFromTask('Write code to "lib/handler.ts"', workingDir);
      expect(result.targetPath).toContain('lib');
      expect(result.targetPath).toContain('handler.ts');
      expect(result.confidence).toBe('high');
    });

    test('parses single-quoted file path', () => {
      const result = parseFilePathFromTask("Create 'services/data.ts' with API calls", workingDir);
      expect(result.targetPath).toContain('services');
      expect(result.targetPath).toContain('data.ts');
      expect(result.confidence).toBe('high');
    });

    test('infers file path from function name', () => {
      const result = parseFilePathFromTask('Add a function called calculateSum', workingDir);
      expect(result.targetPath).toContain('generated');
      expect(result.targetPath).toContain('calculateSum.ts');
      expect(result.operation).toBe('create');
      expect(result.confidence).toBe('low');
    });

    test('infers file path from class name', () => {
      const result = parseFilePathFromTask('Create a class UserManager', workingDir);
      expect(result.targetPath).toContain('generated');
      expect(result.targetPath).toContain('UserManager.ts');
      expect(result.confidence).toBe('low');
    });

    test('returns null for no path', () => {
      const result = parseFilePathFromTask('Add a sum function', workingDir);
      expect(result.targetPath).toBeNull();
      expect(result.operation).toBe('create');
      expect(result.confidence).toBe('low');
    });

    test('handles modify operation', () => {
      const result = parseFilePathFromTask('Modify components/Button.tsx to add onClick', workingDir);
      expect(result.targetPath).toContain('components');
      expect(result.targetPath).toContain('Button.tsx');
      expect(result.operation).toBe('update');
      expect(result.confidence).toBe('high');
    });

    test('handles edit operation', () => {
      const result = parseFilePathFromTask('Edit config/settings.json to change theme', workingDir);
      expect(result.targetPath).toContain('config');
      expect(result.targetPath).toContain('settings.json');
      expect(result.operation).toBe('update');
      expect(result.confidence).toBe('high');
    });

    test('parses jsx files', () => {
      const result = parseFilePathFromTask('Create src/App.jsx with main component', workingDir);
      expect(result.targetPath).toContain('src');
      expect(result.targetPath).toContain('App.jsx');
      expect(result.confidence).toBe('high');
    });

    test('parses json files', () => {
      const result = parseFilePathFromTask('Create data/config.json with settings', workingDir);
      expect(result.targetPath).toContain('data');
      expect(result.targetPath).toContain('config.json');
      expect(result.confidence).toBe('high');
    });

    test('parses markdown files', () => {
      const result = parseFilePathFromTask('Create docs/README.md with documentation', workingDir);
      expect(result.targetPath).toContain('docs');
      expect(result.targetPath).toContain('README.md');
      expect(result.confidence).toBe('high');
    });
  });

  describe('isPathSafe', () => {
    test('allows paths within working directory', () => {
      const safePath = path.join(workingDir, 'src', 'utils.ts');
      expect(isPathSafe(safePath, workingDir)).toBe(true);
    });

    test('rejects paths outside working directory', () => {
      const unsafePath = path.join('c:', 'etc', 'passwd');
      expect(isPathSafe(unsafePath, workingDir)).toBe(false);
    });

    test('rejects node_modules', () => {
      const unsafePath = path.join(workingDir, 'node_modules', 'pkg', 'index.js');
      expect(isPathSafe(unsafePath, workingDir)).toBe(false);
    });

    test('rejects .git directory', () => {
      const unsafePath = path.join(workingDir, '.git', 'config');
      expect(isPathSafe(unsafePath, workingDir)).toBe(false);
    });

    test('rejects package.json', () => {
      const unsafePath = path.join(workingDir, 'package.json');
      expect(isPathSafe(unsafePath, workingDir)).toBe(false);
    });

    test('rejects package-lock.json', () => {
      const unsafePath = path.join(workingDir, 'package-lock.json');
      expect(isPathSafe(unsafePath, workingDir)).toBe(false);
    });

    test('rejects tsconfig.json', () => {
      const unsafePath = path.join(workingDir, 'tsconfig.json');
      expect(isPathSafe(unsafePath, workingDir)).toBe(false);
    });

    test('rejects .env file', () => {
      const unsafePath = path.join(workingDir, '.env');
      expect(isPathSafe(unsafePath, workingDir)).toBe(false);
    });

    test('allows nested directories', () => {
      const safePath = path.join(workingDir, 'src', 'components', 'ui', 'Button.tsx');
      expect(isPathSafe(safePath, workingDir)).toBe(true);
    });
  });
});
