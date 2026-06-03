module.exports = {

    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        '@stratcom/lib-functions': '<rootDir>/../lib-functions/src'
    },
    preset: 'ts-jest',
    testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(test).+(ts|tsx|js)'],
    transform: { '^.+\\.(ts|tsx)$': 'ts-jest', '^.+\\.js$': 'babel-jest' },
    transformIgnorePatterns: ['node_modules/(?!(@arcgis|@esri|@stencil)/)'],
    setupFilesAfterEnv: ['./src/setupJest.js'],
    globals: {
        'ts-jest': {
            diagnostics: false,
        },
    },
    automock: false,
    resetMocks: false,
};
