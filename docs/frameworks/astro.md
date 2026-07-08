
# Astro Installation

**Status**: Tested and validated

## Installation

```bash
pnpm add -D env-attr-cleaner
```

## Configuration

```ts
// astro.config.ts
import { defineConfig } from 'astro/config'
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineConfig({
    vite: {
        plugins: [
            envAttrCleaner({
                environments: {
                    development: [],
                    test: [],
                    staging: ['data-test-*', 'data-debug-*'],
                    production: ['data-test-*', 'data-debug-*']
                }
            })
        ]
    }
})
```

> Each key maps to the value of `NODE_ENV`. The array lists the `data-*` attributes to **strip** — all others (e.g. Alpine.js, HTMX, Stimulus) are preserved.

## Usage

```astro
---
// src/pages/login.astro
---

<form data-test-id="login-form" method="post">
    <input
        data-test-id="login-email"
        data-test-class="form-input"
        type="email"
        name="email"
        placeholder="Email"
    />
    <input
        data-test-id="login-password"
        data-test-class="form-input"
        type="password"
        name="password"
        placeholder="Password"
    />
    <button
        data-test-id="login-submit"
        data-test-class="form-button"
        type="submit"
    >
        Login
    </button>
</form>
```

## Testing

env-attr-cleaner keeps `data-test-*` attributes in `development`/`test` and strips them in `staging`/`production`, so the **same selectors** work across every layer:

- **Unit & integration tests** run with `NODE_ENV=test` → attributes are **present**.
- **E2E tests** run against a `development`/`test` build (present); a `production` build has them stripped.

### Unit tests — Vitest + Astro Container API

`.astro` components render to HTML on the server. Use the [Container API](https://docs.astro.build/en/reference/container-reference/) to render one in isolation and assert its test hooks are in the output.

```ts
// src/components/LoginForm.test.ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, it, expect } from 'vitest'
import LoginForm from './LoginForm.astro'

describe('LoginForm', () => {
    it('renders all test hooks', async () => {
        const container = await AstroContainer.create()
        const html = await container.renderToString(LoginForm)

        expect(html).toContain('data-test-id="login-email"')
        expect(html).toContain('data-test-id="login-password"')
        expect(html).toContain('data-test-id="login-submit"')
    })
})
```

> Run Astro component tests with [`getViteConfig`](https://docs.astro.build/en/guides/testing/#vitest) from `astro/config` so Vitest resolves your Astro setup.

### Integration tests — Vitest + Astro Container API

Render a full page (composing several components, props and slots) and assert the rendered markup.

```ts
// src/pages/login.test.ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, it, expect } from 'vitest'
import LoginPage from './login.astro'

describe('login page', () => {
    it('renders the login form with all fields', async () => {
        const container = await AstroContainer.create()
        const html = await container.renderToString(LoginPage)

        expect(html).toContain('data-test-id="login-form"')
        expect(html.match(/data-test-class="form-input"/g) ?? []).toHaveLength(2)
    })
})
```

> Interactive behaviour lives in [client islands](https://docs.astro.build/en/concepts/islands/) (React, Vue, Svelte…). Test the island with its own framework's tools (see the matching guide) and cover the full flow with the E2E layer below.

### E2E tests — Playwright

```ts
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
    await page.goto('/login')

    await page.locator('[data-test-id="login-email"]').fill('user@example.com')
    await page.locator('[data-test-id="login-password"]').fill('password')
    await page.locator('[data-test-id="login-submit"]').click()

    await expect(page).toHaveURL('/dashboard')
})

test('form has the correct fields', async ({ page }) => {
    await page.goto('/login')

    const inputs = page.locator('[data-test-class="form-input"]')
    await expect(inputs).toHaveCount(2)
})
```

### E2E tests — Cypress

```ts
// cypress/e2e/login.cy.ts
describe('Login', () => {
    it('user can log in', () => {
        cy.visit('/login')

        cy.get('[data-test-id="login-email"]').type('user@example.com')
        cy.get('[data-test-id="login-password"]').type('password')
        cy.get('[data-test-id="login-submit"]').click()

        cy.url().should('include', '/dashboard')
    })
})
```

## Verify the Production Build

```bash
# Build for production
pnpm build

# Check the output — no data-test-* attributes
grep -r "data-test" dist/
# Should return nothing
```

---

## AI agent guide

Rules for an AI assistant editing this project, so env-attr-cleaner keeps working:

- **`data-test-id` marks one unique element; `data-test-class` marks a group.** Name them by role (`login-submit`, `product-card`) — never by style, color, or DOM position.
- **Add them directly in the `.astro` markup.** env-attr-cleaner strips `data-test-*` and `data-debug-*` at build time in `staging`/`production`, so they never reach users — adding them costs nothing in the shipped output.
- **In tests, select on these attributes only** — `[data-test-id="..."]` / `[data-test-class="..."]` — never on CSS classes, tag structure, or visible text.
- **Never branch runtime logic on them.** They are absent in production; treat them as test/debug metadata only.
- **Leave every other `data-*` attribute untouched** (ARIA, Alpine, HTMX…): env-attr-cleaner removes only the configured patterns.
- **Pick the test layer deliberately:** unit = one component in isolation, integration = several components / a full view, E2E = the real app in a browser. Attributes are present under `NODE_ENV=test`/`development` and stripped under `staging`/`production`, so run E2E against a dev/test build.
- **Astro note:** unit/integration tests render with the Container API (`renderToString`) and assert the HTML contains the attribute; interactive behaviour lives in client islands, covered by E2E.
