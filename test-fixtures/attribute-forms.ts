/**
 * Attribute forms both packages must handle identically.
 *
 * Not published, and deliberately outside both packages: the unplugin and Bun
 * implementations each carry their own copy of the text layer (the Bun package ships
 * with zero dependencies, so it cannot import a shared one), and the two test suites
 * used to assert only the intersection of their behaviour. That is what let the Bun
 * regex drift down to quoted values alone, unnoticed, across six published releases.
 * Both suites now run this list, so a divergence fails a build instead of shipping.
 */

export interface IAttributeForm {
    /** What form of attribute this exercises. */
    name: string
    /** Source before stripping. */
    input: string
    /** Expected source after stripping `data-test-*`. */
    expected: string
}

/** Forms documented in the README that must be stripped. */
export const STRIPPED_FORMS: IAttributeForm[] = [
    {
        name: 'double-quoted value',
        input: '<button data-test-id="btn" class="primary">Go</button>',
        expected: '<button class="primary">Go</button>',
    },
    {
        name: 'single-quoted value',
        input: "<button data-test-id='btn' class='primary'>Go</button>",
        expected: "<button class='primary'>Go</button>",
    },
    {
        name: 'JSX expression value',
        input: '<button data-test-id={id} className="primary">Go</button>',
        expected: '<button className="primary">Go</button>',
    },
    {
        name: 'JSX expression value with a template literal',
        input: '<button data-test-id={`row-${id}`} className="primary">Go</button>',
        expected: '<button className="primary">Go</button>',
    },
    {
        name: 'Vue shorthand binding',
        input: '<button :data-test-id="id" class="primary">Go</button>',
        expected: '<button class="primary">Go</button>',
    },
    {
        name: 'Vue v-bind binding',
        input: '<button v-bind:data-test-id="id" class="primary">Go</button>',
        expected: '<button class="primary">Go</button>',
    },
    {
        name: 'unquoted value',
        input: '<button data-test-id=btn class="primary">Go</button>',
        expected: '<button class="primary">Go</button>',
    },
    {
        name: 'value-less attribute',
        input: '<button data-test-active class="primary">Go</button>',
        expected: '<button class="primary">Go</button>',
    },
    {
        name: 'self-closing tag',
        input: '<input data-test-id="field" type="text" />',
        expected: '<input type="text" />',
    },
    {
        name: 'several attributes on one tag',
        input: '<button data-test-id="btn" data-test-role="submit" id="go">Go</button>',
        expected: '<button id="go">Go</button>',
    },
]

/** Attributes that must survive, whatever the patterns say about `data-test-*`. */
export const PRESERVED_FORMS: IAttributeForm[] = [
    {
        name: 'unrelated data-* attribute',
        input: '<button data-hx-get="/api" data-test-id="btn">Go</button>',
        expected: '<button data-hx-get="/api">Go</button>',
    },
    {
        name: 'attribute whose name merely starts like the pattern',
        input: '<button data-testimonial="x" data-test-id="btn">Go</button>',
        expected: '<button data-testimonial="x">Go</button>',
    },
    {
        name: 'plain attributes',
        input: '<button class="primary" id="go" disabled data-test-id="btn">Go</button>',
        expected: '<button class="primary" id="go" disabled>Go</button>',
    },
]
