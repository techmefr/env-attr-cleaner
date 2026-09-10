import { readFileSync } from 'fs'
import {
    type IEnvAttrCleanerConfig,
    DEFAULT_CONFIG,
    stripDataAttributes,
    resolvePatterns,
} from './core'

export type { IEnvAttrCleanerConfig }
export {
    matchPattern,
    shouldStrip,
    stripDataAttributes,
    DEFAULT_CONFIG,
    resolvePatterns,
} from './core'

/** Loader Bun should use for a file the plugin has rewritten. */
export type TBunLoader = 'ts' | 'tsx' | 'js' | 'jsx'

/** Subset of the Bun build API used by the envAttrCleaner plugin. */
export interface IBunBuild {
    onLoad: (
        options: { filter: RegExp },
        callback: (args: { path: string }) => Promise<{ contents: string; loader: TBunLoader }>,
    ) => void
}

/** Shape of a Bun bundler plugin. */
export interface IBunPlugin {
    name: string
    setup: (build: IBunBuild) => void
}

/**
 * Files this plugin takes over the loading of.
 *
 * Restricted to what Bun's bundler can actually load. `.vue` and `.svelte` used to be
 * in here, but the plugin then handed the file back as `loader: 'js'` — Bun has no
 * loader for either, so a single-file component reached its parser as JavaScript.
 * Those frameworks go through the unplugin package instead.
 */
const BUN_FILE_PATTERN = /\.(tsx?|jsx?|mjs|cjs)$/

/** Bun's loader for each extension the filter admits. */
const LOADER_BY_EXTENSION: Record<string, TBunLoader> = {
    ts: 'ts',
    tsx: 'tsx',
    js: 'js',
    jsx: 'jsx',
    mjs: 'js',
    cjs: 'js',
}

/**
 * Returns the loader Bun should use for a path, based on its extension.
 * `.tsx` and `.jsx` keep their own loader: handing them back as `ts`/`js`
 * loses JSX parsing.
 */
export function loaderForPath(path: string): TBunLoader {
    const extension = path.split('.').pop() ?? ''
    return LOADER_BY_EXTENSION[extension] ?? 'js'
}

/**
 * Bun plugin that strips non-allowed data-* attributes from source files at build time,
 * based on the current `NODE_ENV`.
 *
 * @param userConfig - Optional partial configuration to override the default environment patterns.
 * @returns A Bun plugin object to pass to `Bun.build({ plugins: [...] })`.
 *
 * @example
 * ```ts
 * import envAttrCleaner from 'env-attr-cleaner-bun'
 *
 * await Bun.build({
 *     entrypoints: ['./src/index.tsx'],
 *     outdir: './dist',
 *     plugins: [envAttrCleaner()]
 * })
 * ```
 */
export function envAttrCleaner(userConfig: Partial<IEnvAttrCleanerConfig> = {}): IBunPlugin {
    const config: IEnvAttrCleanerConfig = {
        environments: { ...DEFAULT_CONFIG.environments, ...userConfig.environments },
    }

    const stripPatterns = resolvePatterns(config)

    return {
        name: 'bun-plugin-env-attr-cleaner',
        setup(build: IBunBuild): void {
            // Nothing to strip in this environment: leave the files to Bun rather than
            // reading every one of them and claiming their loader for an identity
            // transform.
            if (stripPatterns.length === 0) {
                return
            }

            build.onLoad({ filter: BUN_FILE_PATTERN }, async (args: { path: string }) => {
                const source = readFileSync(args.path, 'utf8')

                return {
                    contents: stripDataAttributes(source, stripPatterns),
                    loader: loaderForPath(args.path),
                }
            })
        },
    }
}

export default envAttrCleaner
