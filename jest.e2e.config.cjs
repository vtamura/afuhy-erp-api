// @ts-check

/** @type {import('jest').Config} */
const config = {
    clearMocks: true,
    moduleFileExtensions: ['ts', 'js', 'json'],
    passWithNoTests: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.e2e-spec.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.spec.json',
            },
        ],
    },
}

module.exports = config
