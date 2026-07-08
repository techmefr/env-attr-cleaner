import { createUnplugin } from 'unplugin'
import {
    type IEnvAttrCleanerConfig,
    DEFAULT_CONFIG,
    stripDataAttributes,
    resolvePatterns,
} from './core'

export type { IEnvAttrCleanerConfig }
export { matchPattern, shouldStrip, stripDataAttributes } from './core'

const FILE_PATTERN = /\.(vue|svelte|astro|jsx?|tsx?)$/

/**
 * Universal envAttrCleaner plugin built with unplugin.
 * Strips non-allowed data-* attributes from source files and HTML at build time,
 * based on the current `NODE_ENV`.
 *
 * Supports Vite, Rollup, Webpack, and esbuild via the named exports below.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { vite as envAttrCleaner } from 'env-attr-cleaner'
 * plugins: [envAttrCleaner()]
 *
 * // next.config.ts
 * import { webpack as envAttrCleaner } from 'env-attr-cleaner'
 * webpack(config) { config.plugins.push(envAttrCleaner()); return config }
 * ```
 */
const envAttrCleanerPlugin = createUnplugin((userConfig: Partial<IEnvAttrCleanerConfig> = {}) => {
    const config: IEnvAttrCleanerConfig = {
        environments: { ...DEFAULT_CONFIG.environments, ...userConfig.environments },
    }

    const allowedPatterns = resolvePatterns(config)

    return {
        name: 'env-attr-cleaner',
        enforce: 'pre' as const,

        transformInclude(id: string): boolean {
            return FILE_PATTERN.test(id)
        },

        transform(code: string): string {
            return stripDataAttributes(code, allowedPatterns)
        },

        vite: {
            transformIndexHtml(html: string): string {
                return stripDataAttributes(html, allowedPatterns)
            },
        },
    }
})

/** Vite plugin adapter. */
export const vite = envAttrCleanerPlugin.vite

/** Rollup plugin adapter. */
export const rollup = envAttrCleanerPlugin.rollup

/** Webpack plugin adapter (also works with Next.js). */
export const webpack = envAttrCleanerPlugin.webpack

/** esbuild plugin adapter. */
export const esbuild = envAttrCleanerPlugin.esbuild

export default envAttrCleanerPlugin
