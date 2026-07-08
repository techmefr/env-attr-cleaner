# React Installation

**Status**: Tested and validated

This guide covers a standard React app bundled with **Vite**. For React via Next.js, see the [Next.js guide](./nextjs.md); for a webpack-based setup (e.g. Create React App), see the [webpack note](#create-react-app--webpack) below.

## Installation

```bash
pnpm add -D env-attr-cleaner
```

## Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineConfig({
    plugins: [
        react(),
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

> Each environment key matches `NODE_ENV`. The array defines which `data-*` attributes to **strip** — all other `data-*` attributes (e.g. from Alpine.js, HTMX, Stimulus) are left untouched.

## Usage

Add `data-test-*` attributes to any element you want to target in tests. They stay in `development` and `test` builds and are removed from `staging` and `production` builds.

```tsx
// src/LoginForm.tsx
import { useState } from 'react'

export function LoginForm() {
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

## Testing

env-attr-cleaner keeps `data-test-*` attributes in the `development` and `test` environments and strips them in `staging`/`production`, so the **same selectors** work across every test layer:

- **Unit & integration tests** run with `NODE_ENV=test` → attributes are **present**.
- **E2E tests** should run against a `development`/`test` build (present); a `production` build has them stripped.

### Unit tests — Vitest + React Testing Library

Render a single component in isolation and assert its test hooks are wired up.

```tsx
// src/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
    it('renders all fields', () => {
        render(<LoginForm />)

        expect(screen.getByTestId('login-email')).toBeInTheDocument()
        expect(screen.getByTestId('login-password')).toBeInTheDocument()
        expect(screen.getByTestId('login-submit')).toBeInTheDocument()
    })

    it('has the correct number of inputs', () => {
        const { container } = render(<LoginForm />)

        const inputs = container.querySelectorAll('[data-test-class="form-input"]')
        expect(inputs).toHaveLength(2)
    })

    it('updates the email field', () => {
        render(<LoginForm />)

        const email = screen.getByTestId('login-email')
        fireEvent.change(email, { target: { value: 'user@example.com' } })

        expect(email).toHaveValue('user@example.com')
    })
})
```

> `getByTestId` reads `data-testid` by default. To target `data-test-id`, set `testIdAttribute: 'data-test-id'` in your Testing Library config, or query with `container.querySelector('[data-test-id="..."]')`.

### Integration tests — Vitest + React Testing Library + user-event

Render a composed view (several components working together) and drive a real user flow.

```tsx
// src/LoginPage.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { LoginPage } from './LoginPage'

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

## Create React App / webpack

If your React app is bundled with webpack instead of Vite, use the webpack adapter:

```js
// webpack.config.js
const { webpack: envAttrCleaner } = require('env-attr-cleaner')

module.exports = {
    plugins: [
        envAttrCleaner({
            environments: {
                development: [],
                test: [],
                staging: ['data-test-*', 'data-debug-*'],
                production: ['data-test-*', 'data-debug-*'],
            },
        }),
    ],
}
```

See the [Next.js guide](./nextjs.md) for a complete webpack-based example.

---

## AI agent guide

Rules for an AI assistant editing this project, so env-attr-cleaner keeps working:

- **`data-test-id` marks one unique element; `data-test-class` marks a group.** Name them by role (`login-submit`, `product-card`) — never by style, color, or DOM position.
- **Add them directly in the JSX.** env-attr-cleaner strips `data-test-*` and `data-debug-*` at build time in `staging`/`production`, so they never reach users — adding them costs nothing in the shipped output.
- **In tests, select on these attributes only** — `[data-test-id="..."]` / `[data-test-class="..."]` — never on CSS classes, tag structure, or visible text.
- **Never branch runtime logic on them.** They are absent in production; treat them as test/debug metadata only.
- **Leave every other `data-*` attribute untouched** (ARIA, Alpine, HTMX…): env-attr-cleaner removes only the configured patterns.
- **Pick the test layer deliberately:** unit = one component in isolation, integration = several components / a full view, E2E = the real app in a browser. Attributes are present under `NODE_ENV=test`/`development` and stripped under `staging`/`production`, so run E2E against a dev/test build.
- **React note:** Testing Library's `getByTestId` reads `data-testid` by default — set `configure({ testIdAttribute: 'data-test-id' })` once, or query `container.querySelector('[data-test-id="..."]')`.
