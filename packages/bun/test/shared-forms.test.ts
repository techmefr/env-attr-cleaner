import { describe, it, expect } from 'vitest'
import { matchPattern, stripDataAttributes } from '../src/core'
import { STRIPPED_FORMS, PRESERVED_FORMS } from '../../../test-fixtures/attribute-forms'

const PATTERNS = ['data-test-*']

describe('documented attribute forms', () => {
    it.each(STRIPPED_FORMS)('strips the $name', ({ input, expected }) => {
        expect(stripDataAttributes(input, PATTERNS)).toBe(expected)
    })

    it.each(PRESERVED_FORMS)('preserves the $name', ({ input, expected }) => {
        expect(stripDataAttributes(input, PATTERNS)).toBe(expected)
    })
})

describe('pattern metacharacters', () => {
    it('treats a dot literally instead of as a wildcard', () => {
        expect(matchPattern('data-test-id', 'data.test.id')).toBe(false)
        expect(matchPattern('data.test.id', 'data.test.id')).toBe(true)
    })

    it('treats an alternation literally instead of matching every attribute', () => {
        expect(matchPattern('data-hx-get', 'data-a|.*')).toBe(false)
    })

    it('does not throw on an unbalanced group', () => {
        expect(() => matchPattern('data-test-id', 'data-(')).not.toThrow()
        expect(matchPattern('data-test-id', 'data-(')).toBe(false)
    })

    it('expands a wildcard over attribute-name characters only', () => {
        expect(matchPattern('data-test-id', 'data-test-*')).toBe(true)
        expect(matchPattern('data-testimonial', 'data-test-*')).toBe(false)
    })
})
