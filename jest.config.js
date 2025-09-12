//const { resolve } = require('path');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.steps.ts', '**/*.test.ts'],
    collectCoverageFrom: [],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    moduleNameMapper: {},
    testResultsProcessor: 'jest-junit',
    reporters: ['default', ['jest-junit', { outputDirectory: 'test-results', outputName: 'test-report.xml' }]],
};
