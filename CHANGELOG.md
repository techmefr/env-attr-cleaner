# Changelog

## v1.0.5

[compare changes](https://github.com/techmefr/env-attr-cleaner/compare/v1.0.4...v1.0.5)

### 🤖 CI

- **release:** Trigger publish via workflow_run, not just push ([#5](https://github.com/techmefr/env-attr-cleaner/pull/5))

### ❤️ Contributors

- Gaetan Compigni ([@techmefr](http://github.com/techmefr))

## v1.0.4

[compare changes](https://github.com/techmefr/env-attr-cleaner/compare/v1.0.3...v1.0.4)

### 🩹 Fixes

- **deps:** Resync pnpm-lock.yaml with package.json specs ([#3](https://github.com/techmefr/env-attr-cleaner/pull/3))

### 🤖 CI

- **release:** Publish via npm trusted publishing on version bump ([#1](https://github.com/techmefr/env-attr-cleaner/pull/1))
- **release:** Open a pr instead of pushing to main directly ([#2](https://github.com/techmefr/env-attr-cleaner/pull/2))

### ❤️ Contributors

- Gaetan Compigni ([@techmefr](http://github.com/techmefr))

## v1.0.3

[compare changes](https://github.com/techmefr/env-attr-cleaner/compare/v1.0.2...v1.0.3)

### 🩹 Fixes

- **unplugin:** Generate sourcemaps in transform hook ([835740d](https://github.com/techmefr/env-attr-cleaner/commit/835740d))

### ❤️ Contributors

- G.compigni <g.compigni@skera.com>

## v1.0.2

[compare changes](https://github.com/techmefr/env-attr-cleaner/compare/v1.0.1...v1.0.2)

### 🩹 Fixes

- **unplugin:** Widen webpack and next peer dependency ranges ([27c64f1](https://github.com/techmefr/env-attr-cleaner/commit/27c64f1))

### ❤️ Contributors

- G.compigni <g.compigni@skera.com>

## v1.0.1

[compare changes](https://github.com/techmefr/env-attr-cleaner/compare/v1.0.0...v1.0.1)

### 🩹 Fixes

- **unplugin:** Widen vite peer dependency range to >=4.0.0 ([778a52c](https://github.com/techmefr/env-attr-cleaner/commit/778a52c))
- **scripts:** Bump version and changelog in release script ([cecc90f](https://github.com/techmefr/env-attr-cleaner/commit/cecc90f))

### ❤️ Contributors

- G.compigni <g.compigni@skera.com>

## 1.0.0

Initial public release.

`env-attr-cleaner` strips `data-test-*` (and any configured) attributes from production builds while keeping them in development and test. The removal happens at build time — zero runtime cost.

### Packages

- **`env-attr-cleaner`** — universal [unplugin](https://github.com/unjs/unplugin): Vite, Rollup, Webpack, esbuild (Nuxt, Vue, React, Next.js, SvelteKit, Astro).
- **`env-attr-cleaner-bun`** — native Bun build plugin.

### Configuration

Per-`NODE_ENV` blocklist: `environments` lists the `data-*` patterns to strip per environment; every other `data-*` (HTMX, Alpine, ARIA…) is preserved.

```ts
envAttrCleaner({
    environments: {
        development: [],
        test: [],
        staging: ['data-test-*', 'data-debug-*'],
        production: ['data-test-*', 'data-debug-*'],
    },
})
```

Extracted from an internal monorepo and published standalone.
