import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Coverage is reported on src/ only, with thresholds: nothing flagged the bun
        // package's onLoad callback sitting at 0% for six releases while its docs said
        // "tested and validated".
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            reporter: ['text', 'lcov'],
            thresholds: {
                lines: 95,
                functions: 95,
                statements: 95,
                branches: 90,
            },
        },
    },
})
