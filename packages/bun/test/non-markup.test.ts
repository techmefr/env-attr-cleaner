import { describe, it, expect } from 'vitest'
import { stripDataAttributes } from '../src/core'
import { findTagRanges } from '../src/tags'
import { NON_MARKUP_CASES, TRICKY_MARKUP_CASES } from '../../../test-fixtures/non-markup'

const PATTERNS = ['data-test-*']

describe('code that is not markup', () => {
    it.each(NON_MARKUP_CASES)('leaves the $name untouched', ({ code }) => {
        expect(stripDataAttributes(code, PATTERNS)).toBe(code)
    })
})

describe('markup holding tricky code', () => {
    it.each(TRICKY_MARKUP_CASES)('still strips with an $name', ({ input, expected }) => {
        expect(stripDataAttributes(input, PATTERNS)).toBe(expected)
    })
})

describe('findTagRanges', () => {
    it('does not end a tag on a greater-than sign inside braces', () => {
        expect(findTagRanges('<div hidden={a > b}>x</div>')).toEqual([{ start: 0, end: 19 }])
    })

    // Known limitation, without consequence: see the unplugin suite.
    it('reads a spaceless comparison as a tag, without consequence', () => {
        const code = 'if (a <b && c> d) {}'
        expect(findTagRanges(code)).toEqual([{ start: 6, end: 13 }])
        expect(stripDataAttributes(code, PATTERNS)).toBe(code)
    })

    it('ignores an unterminated tag opening', () => {
        expect(findTagRanges('const s = "<button class=')).toEqual([])
    })
})
