import {
    type IEnvAttrCleanerConfig,
    DEFAULT_CONFIG,
    stripDataAttributes,
    resolvePatterns,
} from './core'

export type { IEnvAttrCleanerConfig }
export { matchPattern, shouldStrip, stripDataAttributes } from './core'

/** Subset of the Bun build API used by the envAttrCleaner plugin. */
export interface IBunBuild {
    onLoad: (
        options: { filter: RegExp },
        callback: (args: { path: string }) => Promise<{ contents: string; loader: string }>,
    ) => void
}

/** Shape of a Bun bundler plugin. */
export interface IBunPlugin {
    name: string
    setup: (build: IBunBuild) => void
}

const BUN_FILE_PATTERN = /\.(tsx?|jsx?|vue|svelte)$/

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

    const allowedPatterns = resolvePatterns(config)

    return {
        name: 'bun-plugin-env-attr-cleaner',
        setup(build: IBunBuild): void {
            build.onLoad({ filter: BUN_FILE_PATTERN }, async (args: { path: string }) => {
                const fs = await import('fs')
                const source = fs.readFileSync(args.path, 'utf8')
                const loader =
                    args.path.endsWith('.ts') || args.path.endsWith('.tsx') ? 'ts' : 'js'

                return {
                    contents: stripDataAttributes(source, allowedPatterns),
                    loader,
                }
            })
        },
    }
}

export default envAttrCleaner
