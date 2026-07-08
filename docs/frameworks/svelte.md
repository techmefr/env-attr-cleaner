# Svelte Installation

**Status**: Tested and validated

This guide covers **Svelte 5 + Vite**. For **SvelteKit**, the setup is identical — swap the Vite plugin as noted below.

## Installation

```bash
pnpm add -D env-attr-cleaner
```

## Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineConfig({
    plugins: [
        svelte(),
        envAttrCleaner({
            environments: {
                development: [],
                test: [],
                staging: ['data-test-*', 'data-debug-*'],
                production: ['data-test-*', 'data-debug-*'],
            },
        }),
    ],
})
```

> **SvelteKit**: replace `svelte()` with `sveltekit()` from `@sveltejs/kit/vite`. The `envAttrCleaner()` plugin entry stays the same.

> Each environment key matches `NODE_ENV`. The array defines which `data-*` attributes to **strip** — all other `data-*` attributes (e.g. from Alpine.js, HTMX, Stimulus) are left untouched.

## Usage

```svelte
<!-- src/LoginForm.svelte -->
<script lang="ts">
let email = $state('')
let password = $state('')

function handleSubmit(event: SubmitEvent): void {
    event.preventDefault()
    // handle login
}
</script>

<form data-test-id="login-form" onsubmit={handleSubmit}>
    <input
        data-test-id="login-email"
        data-test-class="form-input"
        type="email"
        bind:value={email}
    />
    <input
        data-test-id="login-password"
        data-test-class="form-input"
        type="password"
        bind:value={password}
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

env-attr-cleaner keeps `data-test-*` attributes in the `development` and `test` environments and strips them in `staging`/`production`, so the **same selectors** work across every test layer:

- **Unit & integration tests** run with `NODE_ENV=test` → attributes are **present**.
- **E2E tests** should run against a `development`/`test` build (present); a `production` build has them stripped.

### Unit tests — Vitest + Testing Library for Svelte

Render a single component in isolation and assert its test hooks are wired up.

```ts
// src/LoginForm.test.ts
import { render, screen } from '@testing-library/svelte'
import { describe, it, expect } from 'vitest'
import LoginForm from './LoginForm.svelte'

describe('LoginForm', () => {
    it('renders all fields', () => {
        render(LoginForm)

        expect(screen.getByTestId('login-email')).toBeInTheDocument()
        expect(screen.getByTestId('login-password')).toBeInTheDocument()
        expect(screen.getByTestId('login-submit')).toBeInTheDocument()
    })
})
```

> `getByTestId` reads `data-testid` by default. To target `data-test-id`, set it once in your test setup with `configure({ testIdAttribute: 'data-test-id' })` from `@testing-library/dom`, or query with `container.querySelector('[data-test-id="..."]')`.

### Integration tests — Testing Library for Svelte + user-event

Render a composed view (several components working together) and drive a real user flow.

```ts
// src/LoginPage.test.ts
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import LoginPage from './LoginPage.svelte'

describe('LoginPage', () => {
    it('logs in and reveals the dashboard', async () => {
        const user = userEvent.setup()
        render(LoginPage)

        await user.type(screen.getByTestId('login-email'), 'user@example.com')
        await user.type(screen.getByTestId('login-password'), 'password')
        await user.click(screen.getByTestId('login-submit'))

        expect(await screen.findByTestId('dashboard')).toBeInTheDocument()
    })
})
```

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

> Run E2E tests against a `development` or `test` build so the `data-test-*` attributes are still present. A `production` build has them stripped.

## Verify the Production Build

```bash
# Build for production
pnpm build

# Check the output — no data-test-* attributes
grep -r "data-test" dist/
# Should return nothing
```

> On **SvelteKit**, run `pnpm build` then `pnpm preview` and inspect the served HTML, or grep the adapter output directory.

---

## AI agent guide

Rules for an AI assistant editing this project, so env-attr-cleaner keeps working:

- **`data-test-id` marks one unique element; `data-test-class` marks a group.** Name them by role (`login-submit`, `product-card`) — never by style, color, or DOM position.
- **Add them directly in the markup.** env-attr-cleaner strips `data-test-*` and `data-debug-*` at build time in `staging`/`production`, so they never reach users — adding them costs nothing in the shipped output.
- **In tests, select on these attributes only** — `[data-test-id="..."]` / `[data-test-class="..."]` — never on CSS classes, tag structure, or visible text.
- **Never branch runtime logic on them.** They are absent in production; treat them as test/debug metadata only.
- **Leave every other `data-*` attribute untouched** (ARIA, Alpine, HTMX…): env-attr-cleaner removes only the configured patterns.
- **Pick the test layer deliberately:** unit = one component in isolation, integration = several components / a full view, E2E = the real app in a browser. Attributes are present under `NODE_ENV=test`/`development` and stripped under `staging`/`production`, so run E2E against a dev/test build.
- **Svelte note:** use Svelte 5 runes (`$state`) and `onsubmit={...}`; with `@testing-library/svelte` set `configure({ testIdAttribute: 'data-test-id' })` or query by attribute selector.
