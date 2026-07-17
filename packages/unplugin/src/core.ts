import MagicString from 'magic-string'
import type { SourceMap } from 'magic-string'

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
 * Matches a data-* attribute with its leading whitespace, in all recognised forms:
 * quoted, expression, bound (Vue), unquoted, and value-less. The attribute name
 * is captured in group 1.
 */
const DATA_ATTR_REGEX =
    /\s+(?:v-bind:|:)?(data-[\w-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^\s"'`<>/{}]+)|(?=[\s/>]|$))/g

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
 * Recognised attribute forms:
 * - quoted values: `data-test-id="x"`, `data-test-id='x'`
 * - expression values: `data-test-id={id}`, `` data-test-id={`p-${id}`} `` (JSX / Svelte)
 * - bound names: `:data-test-id="x"`, `v-bind:data-test-id="x"` (Vue)
 * - unquoted values: `data-test-id=x`
 * - value-less attributes: `data-test-active`
 *
 * @param code - The source string to process.
 * @param stripPatterns - List of glob patterns for attributes to remove.
 * @returns The processed string with matched data-* attributes removed.
 */
export function stripDataAttributes(code: string, stripPatterns: string[]): string {
    return code.replace(DATA_ATTR_REGEX, (match, attr) =>
        shouldStrip(attr, stripPatterns) ? '' : match,
    )
}

/**
 * Result of a sourcemap-aware strip operation.
 */
export interface IStripResult {
    /** The processed code with matched data-* attributes removed. */
    code: string
    /** Sourcemap describing the transformation. */
    map: SourceMap
}

/**
 * Sourcemap-aware variant of {@link stripDataAttributes}, intended for
 * bundler `transform` hooks. Removes matched data-* attributes through
 * `magic-string` and generates a high-resolution sourcemap so the
 * transformation keeps the sourcemap chain intact.
 *
 * @param code - The source string to process.
 * @param stripPatterns - List of glob patterns for attributes to remove.
 * @returns The processed code and its sourcemap, or `null` when nothing was stripped.
 */
export function stripDataAttributesWithMap(
    code: string,
    stripPatterns: string[],
): IStripResult | null {
    if (stripPatterns.length === 0) {
        return null
    }

    const s = new MagicString(code)
    let changed = false

    for (const match of code.matchAll(DATA_ATTR_REGEX)) {
        if (shouldStrip(match[1], stripPatterns)) {
            s.remove(match.index, match.index + match[0].length)
            changed = true
        }
    }

    if (!changed) {
        return null
    }

    return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
    }
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
