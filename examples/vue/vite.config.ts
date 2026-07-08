import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineConfig({
    plugins: [
        vue(),
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
