import { defineConfig } from 'astro/config'
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineConfig({
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
