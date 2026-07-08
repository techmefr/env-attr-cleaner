import { describe, it, expect, afterEach } from 'vitest'
import { envAttrCleaner, matchPattern, shouldStrip, stripDataAttributes } from '../src/index'
import { resolvePatterns, DEFAULT_CONFIG } from '../src/core'

describe('matchPattern', () => {
    it('matches an exact pattern', () => {
        expect(matchPattern('data-test-id', 'data-test-id')).toBe(true)
    })

    it('matches a wildcard pattern', () => {
        expect(matchPattern('data-test-id', 'data-test-*')).toBe(true)
        expect(matchPattern('data-test-class', 'data-test-*')).toBe(true)
    })

    it('does not match a different pattern', () => {
        expect(matchPattern('data-debug-state', 'data-test-*')).toBe(false)
    })
})

describe('shouldStrip', () => {
    it('returns true when the attribute matches a strip pattern', () => {
        expect(shouldStrip('data-test-id', ['data-test-*'])).toBe(true)
    })

    it('returns false when the attribute does not match any strip pattern', () => {
        expect(shouldStrip('data-hx-get', ['data-test-*'])).toBe(false)
    })

    it('returns false when the strip patterns list is empty', () => {
        expect(shouldStrip('data-test-id', [])).toBe(false)
    })
})

describe('stripDataAttributes', () => {
    it('strips nothing when the strip patterns list is empty', () => {
        const code = '<button data-test-id="btn" data-hx-get="/api">Click</button>'
        expect(stripDataAttributes(code, [])).toBe('<button data-test-id="btn" data-hx-get="/api">Click</button>')
    })

    it('strips only matched attributes and preserves the rest', () => {
        const code = '<button data-test-id="btn" data-hx-get="/api">Click</button>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<button data-hx-get="/api">Click</button>')
    })

    it('preserves non-data attributes', () => {
        const code = '<button data-test-id="btn" class="primary" id="submit">Click</button>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<button class="primary" id="submit">Click</button>')
    })
})

describe('envAttrCleaner bun plugin', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
        process.env.NODE_ENV = originalEnv
    })

    it('returns a plugin with the correct name', () => {
        const plugin = envAttrCleaner()
        expect(plugin.name).toBe('bun-plugin-env-attr-cleaner')
    })

    it('returns a plugin with a setup function', () => {
        const plugin = envAttrCleaner()
        expect(typeof plugin.setup).toBe('function')
    })

    it('accepts custom environment config', () => {
        const plugin = envAttrCleaner({ environments: { production: ['data-analytics-*'] } })
        expect(plugin.name).toBe('bun-plugin-env-attr-cleaner')
    })

    it('registers an onLoad handler for the expected file pattern', () => {
        const plugin = envAttrCleaner()
        const registeredFilters: RegExp[] = []

        plugin.setup({
            onLoad(options, _callback) {
                registeredFilters.push(options.filter)
            },
        })

        expect(registeredFilters).toHaveLength(1)
        expect(registeredFilters[0].test('component.vue')).toBe(true)
        expect(registeredFilters[0].test('index.ts')).toBe(true)
        expect(registeredFilters[0].test('styles.css')).toBe(false)
    })
})

describe('resolvePatterns', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
        process.env.NODE_ENV = originalEnv
    })

    it('returns an empty array for the development environment', () => {
        process.env.NODE_ENV = 'development'
        expect(resolvePatterns(DEFAULT_CONFIG)).toEqual([])
    })

    it('returns an empty array for the test environment', () => {
        process.env.NODE_ENV = 'test'
        expect(resolvePatterns(DEFAULT_CONFIG)).toEqual([])
    })

    it('returns strip patterns for the staging environment', () => {
        process.env.NODE_ENV = 'staging'
        expect(resolvePatterns(DEFAULT_CONFIG)).toEqual(['data-test-*', 'data-debug-*'])
    })

    it('returns strip patterns for the production environment', () => {
        process.env.NODE_ENV = 'production'
        expect(resolvePatterns(DEFAULT_CONFIG)).toEqual(['data-test-*', 'data-debug-*'])
    })

    it('returns an empty array for an unknown environment', () => {
        process.env.NODE_ENV = 'unknown'
        expect(resolvePatterns(DEFAULT_CONFIG)).toEqual([])
    })

    it('falls back to development patterns when NODE_ENV is undefined', () => {
        delete process.env.NODE_ENV
        expect(resolvePatterns(DEFAULT_CONFIG)).toEqual([])
    })

    it('uses custom environment patterns when provided', () => {
        process.env.NODE_ENV = 'production'
        expect(resolvePatterns({ environments: { production: ['data-analytics-*'] } })).toEqual([
            'data-analytics-*',
        ])
    })
})
