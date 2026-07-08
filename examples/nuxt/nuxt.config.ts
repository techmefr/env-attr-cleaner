import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineNuxtConfig({
    vite: {
        plugins: [
            envAttrCleaner({
                environments: {
                    development: [],
                    test: [],
                    staging: ['data-test-*', 'data-debug-*'],
                    production: ['data-test-*', 'data-debug-*'],
                },
            }),
        ],
    },
})
