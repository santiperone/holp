export default {
  preset: 'ts-jest',
  modulePaths: ['./src/'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/errors/**/*.ts'],
  coverageReporters: ['text'],
};
