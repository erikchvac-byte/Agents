module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'agents/**/*.{js,ts}',
    'state/**/*.{js,ts}'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      lines: 85,
      functions: 85,
      statements: 85
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/logs/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/logs/'
  ],
  verbose: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: {
        strict: true
      }
    }
  }
};
