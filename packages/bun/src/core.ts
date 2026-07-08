/**
 * Per-environment configuration for data-* attribute patterns to strip.
 * Each key is an environment name and its value is a list of glob-style patterns to remove.
 */
export interface IEnvAttrCleanerConfig {
    /** Map of environment names to lists of data-* attribute patterns to strip. */
    environments: Record<string, string[]>
}

/**
 * Default configuration.
 * Strips `data-test-*` and `data-debug-*` in staging and production.
 * Strips nothing in development and test environments.
 */
export const DEFAULT_CONFIG: IEnvAttrCleanerConfig = {
    environments: {
        development: [],
        test: [],
        staging: ['data-test-*', 'data-debug-*'],
        production: ['data-test-*', 'data-debug-*'],
    },
}

/**
 * Returns whether a data-* attribute name matches a glob-style pattern.
 * Supports `*` as a wildcard.
 *
 * @param attr - The attribute name to test (e.g. `data-test-id`).
 * @param pattern - The glob pattern to match against (e.g. `data-test-*`).
 */
export function matchPattern(attr: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return regex.test(attr)
}

/**
 * Returns whether a data-* attribute should be stripped,
 * i.e. whether it matches at least one of the strip patterns.
 *
 * @param attr - The attribute name to test.
 * @param patterns - List of glob patterns marking attributes for removal.
 */
export function shouldStrip(attr: string, patterns: string[]): boolean {
    return patterns.some(pattern => matchPattern(attr, pattern))
}

/**
 * Strips data-* attributes from an HTML or source code string
 * when they match one of the given patterns. All other attributes are preserved.
 *
 * @param code - The source string to process.
 * @param stripPatterns - List of glob patterns for attributes to remove.
 * @returns The processed string with matched data-* attributes removed.
 */
export function stripDataAttributes(code: string, stripPatterns: string[]): string {
    return code.replace(/\s+(data-[\w-]+)=(?:"[^"]*"|'[^']*')/g, (match, attr) => {
        if (shouldStrip(attr, stripPatterns)) {
            return ''
        }
        return match
    })
}

/**
 * Resolves the list of strip patterns for the current environment
 * based on `NODE_ENV`. Falls back to `development` if not set.
 *
 * @param config - The envAttrCleaner configuration object.
 * @returns List of glob patterns to strip for the current environment.
 */
export function resolvePatterns(config: IEnvAttrCleanerConfig): string[] {
    const env = process.env.NODE_ENV ?? 'development'
    return config.environments[env] ?? []
}
