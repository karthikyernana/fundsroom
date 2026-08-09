/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
      tsconfig: { strict: false, noImplicitAny: false },
    }],
  },
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
};
