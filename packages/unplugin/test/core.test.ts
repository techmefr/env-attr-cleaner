import { describe, it, expect, afterEach } from 'vitest'
import { matchPattern, shouldStrip, stripDataAttributes, resolvePatterns, DEFAULT_CONFIG } from '../src/core'

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

    it('returns true when the attribute matches any pattern in the list', () => {
        expect(shouldStrip('data-debug-id', ['data-test-*', 'data-debug-*'])).toBe(true)
    })
})

describe('shouldStrip — edge cases', () => {
    it('returns false when the attribute name partially matches but is not a full match', () => {
        expect(shouldStrip('data-test', ['data-test-*'])).toBe(false)
    })

    it('returns true when the first matching pattern in the list matches', () => {
        expect(shouldStrip('data-test-id', ['data-x-*', 'data-test-*', 'data-debug-*'])).toBe(true)
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

    it('preserves framework data attributes (e.g. HTMX, Alpine.js)', () => {
        const code = '<div data-test-id="form" data-x-show="open" data-hx-post="/submit">Form</div>'
        expect(stripDataAttributes(code, ['data-test-*', 'data-debug-*'])).toBe(
            '<div data-x-show="open" data-hx-post="/submit">Form</div>',
        )
    })

    it('preserves non-data attributes', () => {
        const code = '<button data-test-id="btn" class="primary" id="submit">Click</button>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<button class="primary" id="submit">Click</button>')
    })

    it('strips multiple matched attributes on a single element', () => {
        const code = '<input data-test-id="email" data-debug-state="valid" data-hx-get="/check" type="email">'
        expect(stripDataAttributes(code, ['data-test-*', 'data-debug-*'])).toBe(
            '<input data-hx-get="/check" type="email">',
        )
    })

    it('handles empty attribute values', () => {
        const code = '<button data-test-id="" data-hx-get="/api">Click</button>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<button data-hx-get="/api">Click</button>')
    })

    it('returns the original string unchanged when there are no data-* attributes', () => {
        const code = '<button class="primary" id="submit">Click</button>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<button class="primary" id="submit">Click</button>')
    })

    it('strips single-quoted attributes', () => {
        const code = "<button data-test-id='btn' data-hx-get='/api'>Click</button>"
        expect(stripDataAttributes(code, ['data-test-*'])).toBe("<button data-hx-get='/api'>Click</button>")
    })

    it('strips mixed single and double quoted attributes', () => {
        const code = `<button data-test-id="btn" data-debug-state='active' data-hx-get="/api">Click</button>`
        expect(stripDataAttributes(code, ['data-test-*', 'data-debug-*'])).toBe(
            '<button data-hx-get="/api">Click</button>',
        )
    })

    it('strips JSX expression values', () => {
        const code = '<i data-test-id={id} data-hx-get="/api"/>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<i data-hx-get="/api"/>')
    })

    it('strips JSX template-literal expression values with nested braces', () => {
        const code = '<i data-test-id={`product-${product.id}`} class="card"/>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<i class="card"/>')
    })

    it('strips Vue v-bind shorthand attributes (:data-test-id)', () => {
        const code = '<i :data-test-id="id" data-hx-get="/api"/>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<i data-hx-get="/api"/>')
    })

    it('strips Vue v-bind full attributes (v-bind:data-test-id)', () => {
        const code = '<i v-bind:data-test-id="id" class="card"/>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<i class="card"/>')
    })

    it('strips unquoted attribute values', () => {
        const code = '<i data-test-id=submit class="card"/>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<i class="card"/>')
    })

    it('strips value-less attributes', () => {
        const code = '<i data-test-active class="card"/>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<i class="card"/>')
    })

    it('preserves bound framework attributes that do not match', () => {
        const code = '<i :data-hx-get="url" data-test-id="x"/>'
        expect(stripDataAttributes(code, ['data-test-*'])).toBe('<i :data-hx-get="url"/>')
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
