import { envAttrCleaner } from 'env-attr-cleaner-bun'

const result = await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: 'bun',
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
})

if (!result.success) {
    console.error('Build failed:', result.logs)
    process.exit(1)
}

console.log('Build complete:', result.outputs.map(o => o.path))
