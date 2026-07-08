# Changelog

## [0.9.2] - 2026-02-26

### Chore

- Added `commitlint` with strict conventional commit rules (scope required, subject max 72 chars, lowercase, no trailing period)
- Added `simple-git-hooks` to enforce commit rules via `commit-msg` git hook
- Added `changelogen` for automated changelog generation from conventional commits
- Added `release` script (`pnpm release`) to bump versions, generate changelog and create git tag in one step
- Tagged `v0.9.2` as baseline for changelogen
- Added `release.yml` GitHub Actions workflow (manual trigger) to run `pnpm release` and push tag from CI

---


### Fix

- Changed plugin `enforce` from `post` to `pre` in `env-attr-cleaner` — with `post`, the transform received compiled JavaScript where HTML attributes had already been converted to object keys, making the regex ineffective; `pre` ensures the raw source file is processed before the framework compiler runs

### Examples

- Added example projects for all supported frameworks, each verifying that `data-test-*` attributes are absent from the production build:
  - `examples/nuxt` — Nuxt 3 with `env-attr-cleaner` (vite adapter)
  - `examples/vue` — Vue 3 + Vite with `env-attr-cleaner` (vite adapter)
  - `examples/nextjs` — Next.js 15 with `env-attr-cleaner` (webpack adapter)
  - `examples/bun` — Bun server with `env-attr-cleaner-bun`
  - `examples/svelte` — Svelte 5 + Vite with `env-attr-cleaner` (vite adapter)
  - `examples/astro` — Astro 5 with `env-attr-cleaner` (vite adapter)

### Docs

- Added `Exemple` column to framework table in all READMEs (×7 languages) linking to each example project
- Fixed broken Astro docs link (was pointing to `vue.md`)
- Bumped `env-attr-cleaner` and `env-attr-cleaner-bun` to `0.9.2`
- Added Astro framework installation guide in 7 languages (`docs/frameworks/astro.md`)

---

## [0.9.1] - 2026-02-25

### Docs

- Added config semantics explanation to all framework guides (×7 languages): clarifies that `environments` defines what to strip, not what to keep
- Updated all framework config examples to reflect the new blocklist behavior

### Breaking change

- Inverted configuration logic: `environments` now defines which patterns to **strip** (blocklist) instead of which to keep (allowlist)
- This prevents envAttrCleaner from stripping data-* attributes used by other frameworks (Alpine.js, HTMX, Stimulus, etc.)
- Renamed `isAllowed` to `shouldStrip` to reflect the new semantics
- Updated `DEFAULT_CONFIG`: strips `data-test-*` and `data-debug-*` in staging and production; strips nothing in development and test

**Migration:**

```ts
// Before — allowlist (what to keep)
envAttrCleaner({
    environments: {
        development: ['data-test-*', 'data-debug-*'],
        production: []
    }
})

// After — blocklist (what to strip)
envAttrCleaner({
    environments: {
        development: [],
        production: ['data-test-*', 'data-debug-*']
    }
})
```

---

## [0.9.0] - 2026-02-23

### Refactoring

- Replaced three separate packages (`@envAttrCleaner/vite`, `@envAttrCleaner/turbopack`, `env-attr-cleaner-bun`) with two independent packages
- `env-attr-cleaner` — universal support via [unplugin](https://github.com/unjs/unplugin): Vite, Rollup, Webpack, esbuild, Nuxt, Next.js, SvelteKit, Astro
- `env-attr-cleaner-bun` — native Bun adapter, no dependency on unplugin
- Extracted shared core logic into `src/core.ts` in each package

### Docs

- Added JSDoc to all public functions and interfaces in `env-attr-cleaner` and `env-attr-cleaner-bun`
- Updated installation guides for all frameworks (×7 languages)
- Updated translated READMEs

---

## [0.8.0] - 2026-02-01

### Added

- Multilingual documentation (fr, en, de, es, it, pt, zh)
- Per-framework installation guides: Nuxt, Vue, SvelteKit, Next.js, Bun
- Testing guide with Vitest and Playwright snippets

---

## [0.7.0] - 2025-12-01

### Added

- `@envAttrCleaner/turbopack` package — Next.js support via webpack plugin
- `env-attr-cleaner-bun` package — native Bun bundler support
- Unit tests for all three packages

---

## [0.6.0] - 2025-11-01

### Refactoring

- Rewrote as a universal Vite plugin (`@envAttrCleaner/vite`)
- Support for Vue, Nuxt, SvelteKit, Astro via `transform` and `transformIndexHtml`
- Per-environment configuration (`development`, `test`, `staging`, `production`)

---

## [0.1.0] - 2025-10-01

### Initial

- Proof of concept: strip `data-*` attributes at build time
- Basic Vite support
