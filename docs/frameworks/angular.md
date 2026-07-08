# Angular

**Status**: Not supported

env-attr-cleaner does **not** work with Angular, and the reason is architectural rather than a missing adapter.

## Why it can't work

env-attr-cleaner removes `data-*` attributes by **rewriting source text** before the bundler compiles it (its regex matches `data-test-id="..."` in `.vue`, `.svelte`, `.astro`, `.jsx`/`.tsx` files). That model breaks against Angular on every front:

- **The Angular compiler reads source out-of-band.** `@ngtools/webpack` (and the esbuild `application` builder) compile components through their own `CompilerHost`, which reads `.ts` and `templateUrl` `.html` files **directly from disk** — bypassing any webpack/esbuild loader, including an `enforce: 'pre'` one. So env-attr-cleaner's transform never sees the template. *(Verified: with the plugin and with an explicit pre-loader, attributes survived the build.)*
- **External templates are never bundler modules.** A `templateUrl: './x.component.html'` is resolved by the compiler, not imported as a module, so no bundler hook touches it.
- **Post-build stripping doesn't help either.** Angular AOT compiles templates into instruction code, where attributes become array entries like `["data-test-id", "login-submit"]` — not `data-test-id="..."`. env-attr-cleaner's regex (and any HTML-shaped strip) cannot match that form.

In short: there is no point in Angular's pipeline where env-attr-cleaner's text-rewrite can reliably run.

## What to do instead

If you want `data-test-*` attributes stripped from an Angular production build, use an **Angular-native mechanism**, not env-attr-cleaner:

- A **pre-build source transformation** that strips the attributes from a *copy* of `src/**/*.{ts,html}` before `ng build` (e.g. a Node script using env-attr-cleaner's exported `stripDataAttributes`, run against a temporary build tree so your real sources keep them for dev/test). This works because raw source still has the `data-test-id="..."` form — but it means maintaining a build copy.
- A **custom Angular TypeScript transformer / schematic** that drops the attributes during compilation.

For projects that can choose their framework freely and want env-attr-cleaner's zero-config build-time stripping, prefer one of the [supported frameworks](../../README.md#installation) (Nuxt, Vue, React, SvelteKit, Next.js, Astro) whose bundlers expose the source to plugins.

## AI agent guide

- **Do not assume `data-test-*` attributes are stripped in Angular.** They ship to production unless an Angular-native step removes them.
- **Do not add a env-attr-cleaner plugin to an Angular build expecting it to work** — it silently does nothing (the compiler bypasses bundler loaders).
- If stripping is required, implement the **pre-build source transformation** above (reuse `stripDataAttributes` from `env-attr-cleaner`) rather than wiring env-attr-cleaner into the bundler.
