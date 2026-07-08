
# Bun Installation

**Status**: Tested and validated

## Installation

```bash
bun add -D env-attr-cleaner-bun
```

## Configuration

```ts
// build.ts
import { envAttrCleaner } from 'env-attr-cleaner-bun'

await Bun.build({
    entrypoints: ['./src/index.tsx'],
    outdir: './dist',
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
})
```

> Each environment key matches `NODE_ENV`. The array defines which `data-*` attributes to **strip** — all other `data-*` attributes (e.g. from Alpine.js, HTMX, Stimulus) are left untouched.

## Usage with React

```tsx
// src/components/LoginForm.tsx
import { useState } from 'react'

export function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // gerer la connexion
    }

    return (
        <form data-test-id="login-form" onSubmit={handleSubmit}>
            <input
                data-test-id="login-email"
                data-test-class="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                data-test-id="login-password"
                data-test-class="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button
                data-test-id="login-submit"
                data-test-class="form-button"
                type="submit"
            >
                Connexion
            </button>
        </form>
    )
}
```

## Usage with Hono

```tsx
// src/index.tsx
import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

app.get('/', (c) => {
    return c.html(html`
        <!DOCTYPE html>
        <html>
            <body>
                <form data-test-id="contact-form">
                    <input data-test-id="contact-email" type="email" />
                    <button data-test-id="contact-submit">Envoyer</button>
                </form>
            </body>
        </html>
    `)
})

export default app
```

## Build Scripts

```json
// package.json
{
    "scripts": {
        "build": "NODE_ENV=production bun run build.ts",
        "build:dev": "NODE_ENV=development bun run build.ts"
    }
}
```

## Tests with Playwright

```ts
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('utilisateur peut se connecter', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-test-id="login-email"]').fill('user@example.com')
    await page.locator('[data-test-id="login-password"]').fill('password')
    await page.locator('[data-test-id="login-submit"]').click()

    await expect(page).toHaveURL('/dashboard')
})
```

## Verify Production Build

```bash
# Build pour la production
NODE_ENV=production bun run build.ts

# Verifier la sortie
cat dist/index.js | grep "data-test"
# Ne devrait rien retourner
```
