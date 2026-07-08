import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineConfig({
    plugins: [
        react(),
        envAttrCleaner({
            environments: {
                development: [],
                test: [],
                staging: ['data-test-*', 'data-debug-*'],
                production: ['data-test-*', 'data-debug-*'],
            },
        }),
    ],
})
