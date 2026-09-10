/** Half-open range of a tag opening in a source string, from `<` to its `>`. */
export interface ITagRange {
    /** Index of the opening `<`. */
    start: number
    /** Index of the closing `>`. */
    end: number
}

const TAG_NAME_START = /[A-Za-z]/

/**
 * Locates every tag opening in a source string.
 *
 * The strip is a text replacement, so without this it also rewrote attribute-looking
 * text that was never markup — destroying emitted code:
 *
 * ```
 * const q = `?a=1 data-test-id=${id}&keep=2`   ->   `?a=1{id}&keep=2`
 * const msg = 'set data-test-id="foo" on it'   ->   'set on it'
 * ```
 *
 * Attributes only ever appear inside a tag opening, so matches are confined to these
 * ranges. The scan tracks quotes and brace depth rather than stopping at the first
 * `>`: in JSX, `<button onClick={() => go()} data-test-id="x">` would otherwise end
 * at the arrow's `>` and leave the attribute outside every range — a leak, which is
 * the worse failure for this plugin than a missed edit.
 *
 * @param code - The source string to scan.
 * @returns The tag ranges found, in source order.
 */
export function findTagRanges(code: string): ITagRange[] {
    const ranges: ITagRange[] = []
    let index = 0

    while (index < code.length) {
        if (code[index] !== '<' || !TAG_NAME_START.test(code[index + 1] ?? '')) {
            index++
            continue
        }

        const end = findTagEnd(code, index + 1)

        if (end === null) {
            index++
            continue
        }

        ranges.push({ start: index, end })
        index = end + 1
    }

    return ranges
}

/**
 * Scans forward from just after a `<` for the `>` that closes that tag opening.
 *
 * @param code - The source string being scanned.
 * @param from - Index just after the opening `<`.
 * @returns Index of the closing `>`, or null when this was not a tag opening.
 */
function findTagEnd(code: string, from: number): number | null {
    let quote: string | null = null
    let depth = 0

    for (let index = from; index < code.length; index++) {
        const char = code[index]

        if (quote) {
            if (char === quote) {
                quote = null
            }
            continue
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char
            continue
        }

        if (char === '{') {
            depth++
            continue
        }

        if (char === '}') {
            depth = Math.max(0, depth - 1)
            continue
        }

        if (depth > 0) {
            continue
        }

        // A second `<` before any `>` means the first one was not a tag opening
        // (a comparison, a generic), so this is not a range to strip inside.
        if (char === '<') {
            return null
        }

        if (char === '>') {
            return index
        }
    }

    return null
}

/**
 * Returns whether an index falls inside one of the given tag ranges.
 *
 * @param index - Index into the source string.
 * @param ranges - Tag ranges as returned by {@link findTagRanges}, in source order.
 */
export function isInsideTag(index: number, ranges: ITagRange[]): boolean {
    return ranges.some(range => index > range.start && index < range.end)
}
