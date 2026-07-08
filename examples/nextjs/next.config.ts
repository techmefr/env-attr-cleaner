import type { NextConfig } from 'next'
import { webpack as envAttrCleaner } from 'env-attr-cleaner'

const nextConfig: NextConfig = {
    webpack(config) {
        config.plugins.push(
            envAttrCleaner({
                environments: {
                    development: [],
                    test: [],
                    staging: ['data-test-*', 'data-debug-*'],
                    production: ['data-test-*', 'data-debug-*'],
                },
            }),
        )
        return config
    },
}

export default nextConfig
