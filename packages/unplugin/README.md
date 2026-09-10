# env-attr-cleaner

> Strip `data-*` test attributes from production builds. Zero runtime cost.

Write `data-test-id` selectors once, use them in unit, integration and E2E tests, and have them disappear from the production output. Works with Vite, Rollup, Webpack and esbuild through [unplugin](https://github.com/unjs/unplugin) — so with Nuxt, Vue, React, Svelte, Astro and Next.js.

For Bun's own bundler, use [`env-attr-cleaner-bun`](https://www.npmjs.com/package/env-attr-cleaner-bun).

## Installation

```bash
npm install -D env-attr-cleaner
```

Requires Node `^20.19.0 || >=22.12.0`.

## Usage

Import the adapter for your bundler:

```ts
// vite.config.ts
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineConfig({
    plugins: [envAttrCleaner()],
})
```

```ts
// next.config.ts
import { webpack as envAttrCleaner } from 'env-attr-cleaner'

export default {
    webpack(config) {
        config.plugins.push(envAttrCleaner())
        return config
    },
}
```

`rollup` and `esbuild` are exported the same way. There is also a default export, but it is the object `createUnplugin` returns (`.vite`, `.rollup`, `.webpack`, `.esbuild`) — not a callable factory, so prefer the named adapters.

## What it strips

Nothing by default in `development` and `test`; `data-test-*` and `data-debug-*` in `staging` and `production`. Every form of the attribute is recognised:

```jsx
<button data-test-id="submit">        // static
<button data-test-id={id}>            // JSX / Svelte expression
<button :data-test-id="id">           // Vue shorthand binding
<button v-bind:data-test-id="id">     // Vue v-bind
<button data-test-id=submit>          // unquoted
<button data-test-active>             // value-less
```

Every other `data-*` attribute is preserved, HTMX, Alpine and Stimulus bindings included.

Attributes are only stripped **inside a tag opening**. Attribute-looking text elsewhere — in a string, a template literal, a comment — is left alone:

```ts
const msg = 'set data-test-id="foo" on the button'   // untouched
const html = `<button data-test-id="x">Go</button>`  // stripped: it is markup
```

## Configuration

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

Patterns are glob-style: `*` matches any run of attribute-name characters, and every other character is literal. The keys are `NODE_ENV` values.

You can build on the defaults rather than restating them:

```ts
import { DEFAULT_CONFIG, vite as envAttrCleaner } from 'env-attr-cleaner'

envAttrCleaner({
    environments: {
        ...DEFAULT_CONFIG.environments,
        production: [...DEFAULT_CONFIG.environments.production, 'data-analytics-*'],
    },
})
```

## NODE_ENV decides everything

The patterns are resolved from `process.env.NODE_ENV` when the plugin is constructed — that is, when your config file is evaluated. `vite build` and `next build` set it to `production` themselves, so the common case needs nothing.

Two things worth knowing:

- **`--mode` is not `NODE_ENV`.** `vite build --mode staging` still sets `NODE_ENV=production`, so the `staging` key above is not reachable that way. Set it explicitly: `NODE_ENV=staging vite build`.
- **An unconfigured `NODE_ENV` strips nothing** and warns on stderr. `NODE_ENV=prod` is not `production`.

## Also exported

`stripDataAttributes(code, patterns)` and `stripDataAttributesWithMap(code, patterns)` for a pre-processing step of your own, plus `matchPattern`, `shouldStrip`, `DEFAULT_CONFIG` and `resolvePatterns`.

## Limits

- The `transformIndexHtml` pass that cleans `index.html` runs under Vite only. Under Webpack, Rollup and esbuild the plugin transforms source files, not the HTML entry.
- Next.js is wired through the webpack adapter, so a `--turbopack` build bypasses it entirely.

## License

MIT
