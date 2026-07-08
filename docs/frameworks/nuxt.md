
# Nuxt Installation

**Status**: Tested and validated

## Installation

```bash
pnpm add -D env-attr-cleaner
```

## Configuration

```ts
// nuxt.config.ts
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineNuxtConfig({
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

> Each environment key matches `NODE_ENV`. The array defines which `data-*` attributes to **strip** — all other `data-*` attributes (e.g. from Alpine.js, HTMX, Stimulus) are left untouched.

## Usage

```vue
<template>
    <form data-test-id="login-form" @submit.prevent="handleSubmit">
        <input
            data-test-id="login-email"
            data-test-class="form-input"
            type="email"
            v-model="email"
        >
        <input
            data-test-id="login-password"
            data-test-class="form-input"
            type="password"
            v-model="password"
        >
        <button
            data-test-id="login-submit"
            data-test-class="form-button"
            type="submit"
        >
            Login
        </button>
    </form>
</template>
```

## Testing

env-attr-cleaner keeps `data-test-*` attributes in `development`/`test` and strips them in `staging`/`production`, so the **same selectors** work across every layer:

- **Unit & integration tests** run with `NODE_ENV=test` → attributes are **present**.
- **E2E tests** run against a `development`/`test` build (present); a `production` build has them stripped.

### Unit tests — Vitest + Vue Test Utils

Mount a single component in isolation.

```ts
// components/__tests__/LoginForm.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LoginForm from '../LoginForm.vue'

describe('LoginForm', () => {
    it('renders all fields', () => {
        const wrapper = mount(LoginForm)

        expect(wrapper.find('[data-test-id="login-email"]').exists()).toBe(true)
        expect(wrapper.find('[data-test-id="login-password"]').exists()).toBe(true)
        expect(wrapper.findAll('[data-test-class="form-input"]')).toHaveLength(2)
    })
})
```

### Integration tests — @nuxt/test-utils

`mountSuspended` renders a component or page with the full Nuxt runtime (auto-imports, composables, routing), so you can drive flows that touch the framework. Requires `environment: 'nuxt'` in your Vitest config (`defineVitestConfig` from `@nuxt/test-utils/config`).

```ts
// pages/__tests__/login.spec.ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import LoginPage from '../login.vue'

describe('login page', () => {
    it('logs in and reveals the dashboard', async () => {
        const page = await mountSuspended(LoginPage)

        await page.find('[data-test-id="login-email"]').setValue('user@example.com')
        await page.find('[data-test-id="login-password"]').setValue('password')
        await page.find('[data-test-id="login-form"]').trigger('submit')

        expect(page.find('[data-test-id="dashboard"]').exists()).toBe(true)
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

test('form has the right fields', async ({ page }) => {
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

## Verify Production Build

```bash
# Build for production
pnpm build

# Check output - no data-test-* attributes
cat .output/public/index.html | grep "data-test"
# Should return nothing
```

---

## AI agent guide

Rules for an AI assistant editing this project, so env-attr-cleaner keeps working:

- **`data-test-id` marks one unique element; `data-test-class` marks a group.** Name them by role (`login-submit`, `product-card`) — never by style, color, or DOM position.
- **Add them directly in the `<template>`.** env-attr-cleaner strips `data-test-*` and `data-debug-*` at build time in `staging`/`production`, so they never reach users — adding them costs nothing in the shipped output.
- **In tests, select on these attributes only** — `[data-test-id="..."]` / `[data-test-class="..."]` — never on CSS classes, tag structure, or visible text.
- **Never branch runtime logic on them.** They are absent in production; treat them as test/debug metadata only.
- **Leave every other `data-*` attribute untouched** (ARIA, Alpine, HTMX…): env-attr-cleaner removes only the configured patterns.
- **Pick the test layer deliberately:** unit = one component in isolation, integration = several components / a full view, E2E = the real app in a browser. Attributes are present under `NODE_ENV=test`/`development` and stripped under `staging`/`production`, so run E2E against a dev/test build.
- **Nuxt note:** in unit tests query with Vue Test Utils `find('[data-test-id="..."]')`; use `mountSuspended` from `@nuxt/test-utils/runtime` when the component needs auto-imports, composables, or routing.