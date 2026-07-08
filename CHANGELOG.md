# Changelog

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
