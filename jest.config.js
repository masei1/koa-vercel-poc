export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'api/**/*.js',
    'lib/**/*.js',
    'mocks/**/*.js',
    '!**/*.test.js',
    '!**/*.config.js'
  ],
  coverageDirectory: 'coverage',
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js'
  ],
  verbose: true
};
