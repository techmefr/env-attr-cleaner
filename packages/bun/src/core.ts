import { findTagRanges, isInsideTag } from './tags'

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
 *
 * Kept character-for-character identical to the unplugin package's regex, as
 * required by AGENTS.md. It previously only recognised quoted values here, so six
 * of the seven documented forms silently reached production through this package —
 * including `data-test-id={id}` in JSX and `:data-test-id` in Vue, i.e. exactly the
 * files this plugin's filter targets. The shared fixtures in test-fixtures/ now hold
 * both packages to the same forms.
 */
const DATA_ATTR_REGEX =
    /\s+(?:v-bind:|:)?(data-[\w-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^\s"'`<>/{}]+)|(?=[\s/>]|$))/g

const patternCache = new Map<string, RegExp>()

/**
 * Compiles a glob-style attribute pattern into an anchored regex, caching the result.
 *
 * Only `*` carries meaning; every other regex metacharacter is escaped. Without that
 * escaping a pattern was read as a regex: `data.test.id` matched `data-test-id`,
 * `data-a|.*` matched every `data-*` attribute (taking HTMX, Alpine and Stimulus
 * bindings out of the build), and an unbalanced `data-(` threw a SyntaxError
 * mid-build. `*` expands to `[\w-]*` rather than `.*` because an attribute name
 * cannot contain anything else.
 */
function patternToRegex(pattern: string): RegExp {
    const cached = patternCache.get(pattern)
    if (cached) {
        return cached
    }

    const source = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[\\w-]*')
    const regex = new RegExp(`^${source}$`)
    patternCache.set(pattern, regex)

    return regex
}

/**
 * Returns whether a data-* attribute name matches a glob-style pattern.
 * Supports `*` as a wildcard; all other characters are matched literally.
 *
 * @param attr - The attribute name to test (e.g. `data-test-id`).
 * @param pattern - The glob pattern to match against (e.g. `data-test-*`).
 */
export function matchPattern(attr: string, pattern: string): boolean {
    return patternToRegex(pattern).test(attr)
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
    if (stripPatterns.length === 0) {
        return code
    }

    const tagRanges = findTagRanges(code)

    return code.replace(DATA_ATTR_REGEX, (match, attr, offset: number) =>
        shouldStrip(attr, stripPatterns) && isInsideTag(offset, tagRanges) ? '' : match,
    )
}

/**
 * Resolves the list of strip patterns for the current environment
 * based on `NODE_ENV`. Falls back to `development` if not set.
 *
 * An environment name absent from the configuration yields an empty list, which
 * means nothing is stripped — the failure mode that lets attributes reach
 * production. It is warned about rather than left silent: `NODE_ENV=prod` or
 * `NODE_ENV=preprod` used to look exactly like a successful build.
 *
 * @param config - The envAttrCleaner configuration object.
 * @returns List of glob patterns to strip for the current environment.
 */
export function resolvePatterns(config: IEnvAttrCleanerConfig): string[] {
    const env = process.env.NODE_ENV ?? 'development'
    const patterns = config.environments[env]

    if (!Array.isArray(patterns)) {
        const known = Object.keys(config.environments).join(', ')
        console.warn(
            `[env-attr-cleaner] NODE_ENV="${env}" is not configured (known: ${known}) — ` +
                'no attributes will be stripped from this build.',
        )
        return []
    }

    return patterns
}
