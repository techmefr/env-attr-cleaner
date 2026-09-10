import { describe, it, expect } from 'vitest'
import { stripDataAttributes, stripDataAttributesWithMap } from '../src/core'
import { findTagRanges, isInsideTag } from '../src/tags'
import { NON_MARKUP_CASES, TRICKY_MARKUP_CASES } from '../../../test-fixtures/non-markup'

const PATTERNS = ['data-test-*']

describe('code that is not markup', () => {
    it.each(NON_MARKUP_CASES)('leaves the $name untouched', ({ code }) => {
        expect(stripDataAttributes(code, PATTERNS)).toBe(code)
    })

    it.each(NON_MARKUP_CASES)('reports no change for the $name', ({ code }) => {
        expect(stripDataAttributesWithMap(code, PATTERNS)).toBeNull()
    })
})

describe('markup holding tricky code', () => {
    it.each(TRICKY_MARKUP_CASES)('still strips with an $name', ({ input, expected }) => {
        expect(stripDataAttributes(input, PATTERNS)).toBe(expected)
    })

    it.each(TRICKY_MARKUP_CASES)(
        'strips with an $name through the sourcemap path',
        ({ input, expected }) => {
            expect(stripDataAttributesWithMap(input, PATTERNS)?.code).toBe(expected)
        },
    )
})

describe('findTagRanges', () => {
    it('finds a simple tag opening', () => {
        expect(findTagRanges('<button class="a">x</button>')).toEqual([{ start: 0, end: 17 }])
    })

    it('does not end a tag on a greater-than sign inside braces', () => {
        const code = '<div hidden={a > b}>x</div>'
        expect(findTagRanges(code)).toEqual([{ start: 0, end: 19 }])
    })

    it('does not end a tag on a greater-than sign inside a quoted value', () => {
        const code = '<div title="a > b">x</div>'
        expect(findTagRanges(code)).toEqual([{ start: 0, end: 18 }])
    })

    // Known limitation: a comparison with no space after the `<`, followed later by a
    // `>`, reads as a tag opening. Without consequence, because a range only ever gates
    // whether a data-* attribute match inside it gets stripped, and a comparison holds
    // no attribute.
    it('reads a spaceless comparison as a tag, without consequence', () => {
        const code = 'if (a <b && c> d) {}'
        expect(findTagRanges(code)).toEqual([{ start: 6, end: 13 }])
        expect(stripDataAttributes(code, PATTERNS)).toBe(code)
    })

    it('ignores an unterminated tag opening', () => {
        expect(findTagRanges('const s = "<button class=')).toEqual([])
    })

    it('finds several openings and skips the closing tags', () => {
        expect(findTagRanges('<a href="#">x</a><b>y</b>')).toHaveLength(2)
    })

    it('does not treat a closing tag as an opening', () => {
        expect(findTagRanges('</button>')).toEqual([])
    })
})

describe('isInsideTag', () => {
    const ranges = [
        { start: 0, end: 10 },
        { start: 20, end: 30 },
    ]

    it('accepts an index strictly inside a range', () => {
        expect(isInsideTag(5, ranges)).toBe(true)
        expect(isInsideTag(25, ranges)).toBe(true)
    })

    it('rejects an index outside every range', () => {
        expect(isInsideTag(15, ranges)).toBe(false)
        expect(isInsideTag(35, ranges)).toBe(false)
    })

    it('rejects the range boundaries themselves', () => {
        expect(isInsideTag(0, ranges)).toBe(false)
        expect(isInsideTag(10, ranges)).toBe(false)
    })

    it('rejects everything when there is no range', () => {
        expect(isInsideTag(5, [])).toBe(false)
    })
})
