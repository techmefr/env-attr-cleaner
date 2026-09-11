# env-attr-cleaner

> Automatically remove `data-*` test attributes in production.

[![CI](https://github.com/techmefr/env-attr-cleaner/actions/workflows/ci.yml/badge.svg)](https://github.com/techmefr/env-attr-cleaner/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/env-attr-cleaner?label=env-attr-cleaner)](https://www.npmjs.com/package/env-attr-cleaner)
[![npm](https://img.shields.io/npm/v/env-attr-cleaner-bun?label=env-attr-cleaner-bun)](https://www.npmjs.com/package/env-attr-cleaner-bun)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

Writing reliable E2E and unit tests requires targeting DOM elements in a **stable, design-independent** way.

Using CSS classes or complex selectors makes tests fragile:
- a visual refactor can break them
- a DOM structure change can invalidate them
- style and test logic become coupled

Dedicated attributes like `data-test-id` and `data-test-class` are the **most robust method** for selecting elements in tests.

The problem? They remain in production and unnecessarily pollute the DOM.

## The Solution

env-attr-cleaner **removes them automatically at build time**. Zero runtime impact. Clean DOM in production. No client-side overhead, and stable tests in development.

---

## Why Use Data Attributes?

To write reliable tests, it's important to clearly separate:

- **Style** → CSS classes
- **Behavior** → JavaScript
- **Testability** → dedicated `data-test-*` attributes

Why use `data-test-id` instead of CSS classes or complex selectors?

`data-test-*` attributes:
- are independent of design
- survive UI refactors
- make intent explicit in tests
- avoid fragile selectors

Adopting this approach makes your tests more durable and your code more maintainable.

The testing methodology itself — naming conventions, the unit / integration / E2E layers, scenario
snippets — lives in the separate [test-casebook](https://github.com/techmefr/test-casebook) repo. This
one is the build-time cleaner.

---

## Installation

Choose your framework:

| Framework | Guide | Example |
|-----------|-------|---------|
| **Nuxt** | [Nuxt Setup](./docs/frameworks/nuxt.md) | [examples/nuxt](./examples/nuxt) |
| **Vue** | [Vue Setup](./docs/frameworks/vue.md) | [examples/vue](./examples/vue) |
| **React** | [React Setup](./docs/frameworks/react.md) | [examples/react](./examples/react) |
| **Svelte** | [Svelte Setup](./docs/frameworks/svelte.md) | [examples/svelte](./examples/svelte) |
| **Next.js** | [Next.js Setup](./docs/frameworks/nextjs.md) | [examples/nextjs](./examples/nextjs) |
| **Bun** | [Bun Setup](./docs/frameworks/bun.md) | [examples/bun](./examples/bun) |
| **Astro** | [Astro Setup](./docs/frameworks/astro.md) | [examples/astro](./examples/astro) |
| **Angular** | [Why it's not supported](./docs/frameworks/angular.md) | — |

---

## Use with an AI coding agent

[**AGENTS.md**](./AGENTS.md) is the contribution guide for an agent working on **this repository** —
how the packages are laid out, what has to stay in sync between them, how to run the gate.

To have an agent set the methodology up in *your* project — detect the framework, wire the cleaner,
install the test runner, add the `data-test-*` hooks, write the tests — point it at
[test-casebook](https://github.com/techmefr/test-casebook) instead. The dependency is one-way: the
methodology knows about this tool, this tool knows nothing about the methodology.

---

## Configuration

By default, env-attr-cleaner strips `data-test-*` and `data-debug-*` in `staging` and `production`, and
strips nothing at all in `development` and `test`. Every other `data-*` attribute is always preserved.
The keys below are `NODE_ENV` values, and `*` matches any run of attribute-name characters.

```ts
envAttrCleaner({
    environments: {
        development: [],
        test: [],
        staging: ['data-test-*', 'data-debug-*'],
        production: ['data-test-*', 'data-debug-*']
    }
})
```

Rather than restating the defaults to extend them, import them:

```ts
import { DEFAULT_CONFIG } from 'env-attr-cleaner'

envAttrCleaner({
    environments: {
        ...DEFAULT_CONFIG.environments,
        production: [...DEFAULT_CONFIG.environments.production, 'data-analytics-*']
    }
})
```

### NODE_ENV, precisely

Patterns are resolved from `NODE_ENV` when the plugin is constructed, i.e. when your config file is
evaluated. `vite build` and `next build` set it to `production` themselves, so the common case needs
nothing. Two traps:

- **`--mode` is not `NODE_ENV`.** `vite build --mode staging` still sets `NODE_ENV=production`, so the
  `staging` key is not reachable that way — use `NODE_ENV=staging vite build`. Bun sets nothing at all.
- **An unconfigured `NODE_ENV` strips nothing**, and says so on stderr. `NODE_ENV=prod` is not
  `production`.

---

## Result

```html
<!-- Your code -->
<button data-test-id="submit-btn" data-test-class="form-action">
    Submit
</button>

<!-- In development -->
<button data-test-id="submit-btn" data-test-class="form-action">
    Submit
</button>

<!-- In production -->
<button>
    Submit
</button>
```

---

## What gets stripped

env-attr-cleaner removes matching `data-*` attributes in every common form — static, dynamic, bound, unquoted and value-less:

```jsx
<button data-test-id="submit">        // static
<button data-test-id={id}>            // JSX / Svelte expression
<button :data-test-id="id">           // Vue v-bind
<button v-bind:data-test-id="id">     // Vue v-bind (full)
<button data-test-id=submit>          // unquoted
<button data-test-active>             // value-less
```

All of these are removed in `staging`/`production` when they match a configured pattern. Every other
`data-*` attribute (HTMX, Alpine.js, Stimulus…) is preserved — including its bound forms
(`:data-hx-get`).

Attributes are only stripped **inside a tag opening**. Attribute-looking text anywhere else is left
alone, so the strip cannot damage your code:

```ts
const msg = 'set data-test-id="foo" on the button'   // untouched
const q = `?a=1 data-test-id=${id}&keep=2`            // untouched
const html = `<button data-test-id="x">Go</button>`   // stripped: it is markup
```

---

## Testing

The whole point of env-attr-cleaner: write your `data-test-*` selectors **once** and reuse them across every test layer. They are present in `test`/`development` builds and stripped from `staging`/`production` — so the same selector that drives a unit test also drives your E2E run, then disappears in production.

Each guide ships copy-paste snippets for the three layers:

| Framework | Unit | Integration | E2E |
|-----------|------|-------------|-----|
| [Nuxt](./docs/frameworks/nuxt.md#testing) | Vitest + Vue Test Utils | @nuxt/test-utils | Playwright · Cypress |
| [React](./docs/frameworks/react.md#testing) | Vitest + Testing Library | + user-event | Playwright · Cypress |
| [Next.js](./docs/frameworks/nextjs.md#testing) | Vitest + Testing Library | + user-event | Playwright · Cypress |
| [Svelte](./docs/frameworks/svelte.md#testing) | Vitest + Testing Library | + user-event | Playwright · Cypress |
| [Astro](./docs/frameworks/astro.md#testing) | Vitest + Container API | Vitest + Container API | Playwright · Cypress |

> **Unit** — one component in isolation. **Integration** — several components / a full view together. **E2E** — the real app in a browser.

Need deeper, scenario-based snippets — navigation, forms, tables, modals, auth, data fetching, i18n,
state? They live in [test-casebook](https://github.com/techmefr/test-casebook), not here.

---

## Packages

| Package | Version | Bundlers |
|---------|---------|---------|
| [env-attr-cleaner](./packages/unplugin) | [![npm](https://img.shields.io/npm/v/env-attr-cleaner)](https://www.npmjs.com/package/env-attr-cleaner) | Vite, Rollup, Webpack, esbuild — Nuxt, Vue, React, Svelte, Astro, Next.js |
| [env-attr-cleaner-bun](./packages/bun) | [![npm](https://img.shields.io/npm/v/env-attr-cleaner-bun)](https://www.npmjs.com/package/env-attr-cleaner-bun) | Bun |

Both packages are versioned and released together from this repository, so the two badges above
normally show the same number. See the [changelog](./CHANGELOG.md) for what changed in each release.

```bash
# Vite / Rollup / Webpack / esbuild / Nuxt / Next.js
npm install -D env-attr-cleaner

# Bun
bun add -D env-attr-cleaner-bun
```

`env-attr-cleaner` requires Node `^20.19.0 || >=22.12.0` (its `unplugin` dependency does);
`env-attr-cleaner-bun` requires Node `>=18` and has no dependencies at all.

The Bun package handles `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` and `.cjs` — what Bun's bundler can load.
`.vue` and `.svelte` go through `env-attr-cleaner` and its Vite adapter.

---

## Roadmap

env-attr-cleaner currently mixes **two separate concerns** in this repository:

- **The package** — a build-time *cleaner* that strips `data-test-*` / `data-debug-*` attributes from the output.
- **The testing methodology and snippets** — how you structure and write your tests (naming conventions, the unit / integration / E2E layers, selectors).

A future version will **dissociate the two** so each can evolve and be consumed independently: the cleaner package on one side, the testing methodology and its snippets on the other. The documentation will be reorganised accordingly. Until then, the framework guides cover both concerns at once.

---

## Contributing

This project is **community-driven**. Contributions are welcome:

- Report a bug
- Suggest an improvement
- Add a snippet to the testing guide
- Test on a new framework

Open an [Issue](https://github.com/techmefr/env-attr-cleaner/issues) or a [Pull Request](https://github.com/techmefr/env-attr-cleaner/pulls).

---

## License

MIT
