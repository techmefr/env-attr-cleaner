# Next.js Installation

**Status**: Tested and validated

Next.js compiles with webpack, so env-attr-cleaner is wired in through the **webpack adapter**. It works with both the App Router and the Pages Router, on Server and Client Components alike, because the plugin runs on the raw source files before the framework compiler.

## Installation

```bash
pnpm add -D env-attr-cleaner
```

## Configuration

```ts
// next.config.ts
import type { NextConfig } from 'next'
import { webpack as envAttrCleaner } from 'env-attr-cleaner'

const nextConfig: NextConfig = {
    // your existing config
    webpack(config) {
        config.plugins.push(
            envAttrCleaner({
                environments: {
                    development: [],
                    test: [],
                    staging: ['data-test-*', 'data-debug-*'],
                    production: ['data-test-*', 'data-debug-*'],
                },
            }),
        )
        return config
    },
}

export default nextConfig
```

> Each environment key matches `NODE_ENV`. The array defines which `data-*` attributes to **strip** — all other `data-*` attributes (e.g. from Alpine.js, HTMX, Stimulus) are left untouched.

> `next build` sets `NODE_ENV=production`, so the `production` patterns apply. `next dev` uses `development`, where nothing is stripped by default.

## Usage

### Client Components

```tsx
// app/login/page.tsx
'use client'

import { useState } from 'react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        // handle login
    }

    return (
        <form data-test-id="login-form" onSubmit={handleSubmit}>
            <input
                data-test-id="login-email"
                data-test-class="form-input"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
            />
            <input
                data-test-id="login-password"
                data-test-class="form-input"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
            />
            <button
                data-test-id="login-submit"
                data-test-class="form-button"
                type="submit"
            >
                Login
            </button>
        </form>
    )
}
```

### Server Components

```tsx
// app/products/page.tsx
async function getProducts() {
    // fetch products
    return [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
    ]
}

export default async function ProductsPage() {
    const products = await getProducts()

    return (
        <div data-test-id="products-page">
            <h1 data-test-id="products-title">Products</h1>
            <div data-test-class="product-grid">
                {products.map(product => (
                    <div
                        key={product.id}
                        data-test-id={`product-${product.id}`}
                        data-test-class="product-card"
                    >
                        {product.name}
                    </div>
                ))}
            </div>
        </div>
    )
}
```

> Both the dynamic `` data-test-id={`product-${product.id}`} `` and the static `data-test-class="product-card"` are stripped in production — env-attr-cleaner handles dynamic, bound, unquoted and value-less `data-*` forms (see [what gets stripped](../../README.md#what-gets-stripped)).

## Testing

env-attr-cleaner keeps `data-test-*` attributes in `development`/`test` and strips them in `staging`/`production`, so the **same selectors** work across every layer:

- **Unit & integration tests** run with `NODE_ENV=test` → attributes are **present**.
- **E2E tests** run against a `next dev` (development) build (present); a `next build` (production) build has them stripped.

### Unit tests — Vitest + React Testing Library

Test a **Client Component** in isolation. See the [Next.js Vitest guide](https://nextjs.org/docs/app/building-your-application/testing/vitest) for the base setup (`@vitejs/plugin-react` + `jsdom`).

```tsx
// app/login/LoginForm.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
    it('renders all fields', () => {
        render(<LoginForm />)

        expect(screen.getByTestId('login-email')).toBeInTheDocument()
        expect(screen.getByTestId('login-password')).toBeInTheDocument()
        expect(screen.getByTestId('login-submit')).toBeInTheDocument()
    })
})
```

> `getByTestId` reads `data-testid` by default. To target `data-test-id`, set `testIdAttribute: 'data-test-id'` in your Testing Library config, or query with `container.querySelector('[data-test-id="..."]')`.

### Integration tests — Vitest + React Testing Library + user-event

Render several components together and drive a real user flow.

```tsx
// app/login/LoginPage.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import LoginPage from './page'

describe('LoginPage', () => {
    it('logs in and reveals the dashboard', async () => {
        const user = userEvent.setup()
        render(<LoginPage />)

        await user.type(screen.getByTestId('login-email'), 'user@example.com')
        await user.type(screen.getByTestId('login-password'), 'password')
        await user.click(screen.getByTestId('login-submit'))

        expect(await screen.findByTestId('dashboard')).toBeInTheDocument()
    })
})
```

> **Server Components** that fetch data render asynchronously on the server and aren't covered by jsdom-based tests — exercise those through the E2E layer below.

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

test('products page shows all products', async ({ page }) => {
    await page.goto('/products')

    const products = page.locator('[data-test-class="product-card"]')
    await expect(products).toHaveCount(2)
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

> Run E2E tests against a `development` build (`next dev`) so the `data-test-*` attributes are still present. A `production` build has them stripped.

## Verify the Production Build

```bash
# Build for production
pnpm build

# Check the output — no data-test-* attributes
grep -r "data-test" .next/static
# Should return nothing
```

---

## AI agent guide

Rules for an AI assistant editing this project, so env-attr-cleaner keeps working:

- **`data-test-id` marks one unique element; `data-test-class` marks a group.** Name them by role (`login-submit`, `product-card`) — never by style, color, or DOM position.
- **Add them directly in the JSX** (Client or Server Components). env-attr-cleaner strips `data-test-*` and `data-debug-*` at build time in `staging`/`production`, so they never reach users — adding them costs nothing in the shipped output.
- **In tests, select on these attributes only** — `[data-test-id="..."]` / `[data-test-class="..."]` — never on CSS classes, tag structure, or visible text.
- **Never branch runtime logic on them.** They are absent in production; treat them as test/debug metadata only.
- **Leave every other `data-*` attribute untouched** (ARIA, Alpine, HTMX…): env-attr-cleaner removes only the configured patterns.
- **Pick the test layer deliberately:** unit = one component in isolation, integration = several components / a full view, E2E = the real app in a browser. Attributes are present under `NODE_ENV=test`/`development` and stripped under `staging`/`production`, so run E2E against a dev/test build.
- **Next.js note:** unit/integration with Testing Library cover **Client Components**; **Server Components** that fetch data render on the server and are only reachable through the E2E layer.
