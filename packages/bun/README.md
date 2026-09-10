# env-attr-cleaner-bun

> Strip `data-*` test attributes from Bun production builds. Zero dependencies.

The [Bun bundler](https://bun.sh/docs/bundler) plugin counterpart of [`env-attr-cleaner`](https://www.npmjs.com/package/env-attr-cleaner). Write `data-test-id` selectors once, use them across your tests, and have them removed from the production output.

## Installation

```bash
bun add -D env-attr-cleaner-bun
```

## Usage

```ts
import envAttrCleaner from 'env-attr-cleaner-bun'

await Bun.build({
    entrypoints: ['./src/index.tsx'],
    outdir: './dist',
    plugins: [envAttrCleaner()],
})
```

## What it strips

Nothing by default in `development` and `test`; `data-test-*` and `data-debug-*` in `staging` and `production`. Every form of the attribute is recognised — static, JSX expression, Vue binding, unquoted, value-less:

```jsx
<button data-test-id="submit">
<button data-test-id={id}>
<button :data-test-id="id">
<button v-bind:data-test-id="id">
<button data-test-id=submit>
<button data-test-active>
```

Every other `data-*` attribute is preserved, HTMX, Alpine and Stimulus bindings included.

Attributes are only stripped **inside a tag opening**, so attribute-looking text in a string, a template literal or a comment is left alone.

## Which files

`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` and `.cjs` — what Bun's bundler can load. `.vue` and `.svelte` are **not** handled here: Bun has no loader for them, so those go through [`env-attr-cleaner`](https://www.npmjs.com/package/env-attr-cleaner) and its Vite adapter instead.

When the current environment strips nothing, the plugin registers no `onLoad` handler at all rather than reading every file for an identity transform.

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

Patterns are glob-style: `*` matches any run of attribute-name characters, every other character is literal. The keys are `NODE_ENV` values, and you can extend the defaults instead of restating them:

```ts
import envAttrCleaner, { DEFAULT_CONFIG } from 'env-attr-cleaner-bun'

envAttrCleaner({
    environments: {
        ...DEFAULT_CONFIG.environments,
        production: [...DEFAULT_CONFIG.environments.production, 'data-analytics-*'],
    },
})
```

## NODE_ENV decides everything

Patterns are resolved from `process.env.NODE_ENV` when the plugin is constructed. Bun does not set it for you, so a build script has to:

```bash
NODE_ENV=production bun run build.ts
```

An unconfigured `NODE_ENV` strips nothing and warns on stderr — `NODE_ENV=prod` is not `production`.

## Also exported

`stripDataAttributes(code, patterns)`, `matchPattern`, `shouldStrip`, `loaderForPath`, `DEFAULT_CONFIG` and `resolvePatterns`.

## License

MIT
