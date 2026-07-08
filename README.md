# env-attr-cleaner

> Automatically remove `data-*` test attributes in production.

[![CI](https://github.com/techmefr/env-attr-cleaner/actions/workflows/ci.yml/badge.svg)](https://github.com/techmefr/env-attr-cleaner/actions/workflows/ci.yml)
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

See our [testing strategy](./docs/strategy.md) and [naming conventions](./docs/conventions.md).

---

## Installation

Choose your framework:

| Framework | Guide | Example |
|-----------|-------|---------|
| **Nuxt** | [Nuxt Setup](./docs/frameworks/nuxt.md) | [examples/nuxt](./examples/nuxt) |
| **Vue** | [Vue Setup](./docs/frameworks/vue.md) | [examples/vue](./examples/vue) |
| **React** | [React Setup](./docs/frameworks/react.md) | [examples/react](./examples/react) |
| **SvelteKit** | [SvelteKit Setup](./docs/frameworks/svelte.md) | [examples/svelte](./examples/svelte) |
| **Next.js** | [Next.js Setup](./docs/frameworks/nextjs.md) | [examples/nextjs](./examples/nextjs) |
| **Bun** | [Bun Setup](./docs/frameworks/bun.md) | [examples/bun](./examples/bun) |
| **Astro** | [Astro Setup](./docs/frameworks/astro.md) | [examples/astro](./examples/astro) |
| **Angular** | [Why it's not supported](./docs/frameworks/angular.md) | — |

---

## Use with an AI coding agent

Hand [**AGENTS.md**](./AGENTS.md) to an AI coding agent (Claude Code, etc.) — or point it at this repository — and ask it to set up the methodology in your project. The playbook drives the agent end to end: detect your framework, install and wire the cleaner, install the test runner, add the `data-test-*` hooks, write the unit / integration / E2E tests, and verify the production build is clean.

---

## Configuration

By default, env-attr-cleaner removes all `data-*` attributes in production and keeps `data-test-*` in development.

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

All of these are removed in `staging`/`production` when they match a configured pattern. Every other `data-*` attribute (HTMX, Alpine.js, Stimulus…) is preserved — including its bound forms (`:data-hx-get`).

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

Need deeper, scenario-based snippets (forms, tables, modals, auth, i18n, state…)? See the [Nuxt + Vitest testing guide](./docs/testing-guide/README.md):

- Navigation & Routing
- Forms & Validation
- Tables & Lists
- Modals & Dialogs
- Permissions & Auth
- API & Data Fetching
- i18n & Translations
- Stores & State Management
- And more...

---

## Packages

| Package | Version | Bundlers |
|---------|---------|---------|
| [env-attr-cleaner](./packages/unplugin) | 0.9.2 | Vite, Rollup, Webpack, esbuild — Nuxt, Vue, React, SvelteKit, Astro, Next.js |
| [env-attr-cleaner-bun](./packages/bun) | 0.9.2 | Bun |

```bash
# Vite / Rollup / Webpack / esbuild / Nuxt / Next.js
npm install env-attr-cleaner

# Bun
bun add env-attr-cleaner-bun
```

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
