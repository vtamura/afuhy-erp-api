// @ts-check

/** @type {import('jest').Config} */
const config = {
    clearMocks: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        'src/**/*.tsx',
        '!src/**/*.d.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.spec.tsx',
        '!src/**/*.e2e-spec.ts',
        '!src/**/index.ts',
        '!src/**/presentation/http/controllers/**/*.ts',
        '!src/**/presentation/http/routes/**/*.ts',
        '!src/**/presentation/http/docs/**/*.ts',
        '!src/main/bootstrap/**/*.ts',
    ],
    coverageDirectory: 'coverage',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.spec.ts'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/database/',
        '\\.e2e-spec\\.ts$',
    ],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.spec.json',
            },
        ],
    },
}

module.exports = config
