/**
 * Attribute-looking text that is not markup, and must survive the strip untouched.
 *
 * The strip is a text replacement, so it used to rewrite these too — and because the
 * patterns are empty in development and test, the damage only appeared in a production
 * or staging build. Both packages run this list.
 */

export interface INonMarkupCase {
    /** What this case exercises. */
    name: string
    /** Source that must come back unchanged. */
    code: string
}

export const NON_MARKUP_CASES: INonMarkupCase[] = [
    {
        name: 'template literal with an interpolation',
        code: 'const q = `?a=1 data-test-id=${id}&keep=2`',
    },
    {
        name: 'single-quoted string mentioning an attribute',
        code: 'const msg = \'set data-test-id="foo" on the button\'',
    },
    {
        name: 'double-quoted selector string',
        code: 'const sel = "button data-test-id=x"',
    },
    {
        name: 'querySelector call',
        code: 'document.querySelector(\'[data-test-id="submit"]\')',
    },
    {
        name: 'line comment',
        code: '// pass data-test-id="btn" to the component',
    },
    {
        name: 'block comment',
        code: '/* data-test-id=x is stripped in production */',
    },
    {
        name: 'object literal key',
        code: "const attrs = { 'data-test-id': id }",
    },
]

/** Markup that must still be stripped even though it holds tricky code. */
export interface IMarkupCase {
    /** What this case exercises. */
    name: string
    /** Source before stripping. */
    input: string
    /** Expected source after stripping `data-test-*`. */
    expected: string
}

export const TRICKY_MARKUP_CASES: IMarkupCase[] = [
    {
        name: 'arrow function in a JSX attribute before the data attribute',
        input: '<button onClick={() => go()} data-test-id="btn">Go</button>',
        expected: '<button onClick={() => go()}>Go</button>',
    },
    {
        name: 'comparison inside a JSX attribute',
        input: '<div hidden={a > b} data-test-id="row">x</div>',
        expected: '<div hidden={a > b}>x</div>',
    },
    {
        name: 'attribute value containing a greater-than sign',
        input: '<div title="a > b" data-test-id="row">x</div>',
        expected: '<div title="a > b">x</div>',
    },
    {
        name: 'tag spanning several lines',
        input: '<button\n    data-test-id="btn"\n    class="primary"\n>Go</button>',
        expected: '<button\n    class="primary"\n>Go</button>',
    },
    {
        name: 'markup inside a template literal',
        input: 'const html = `<button data-test-id="btn">Go</button>`',
        expected: 'const html = `<button>Go</button>`',
    },
    {
        name: 'nested braces in a JSX attribute',
        input: '<div style={{ color: c }} data-test-id="row">x</div>',
        expected: '<div style={{ color: c }}>x</div>',
    },
]
