
# Vue Installation

**Status**: Tested and validated

## Installation

```bash
pnpm add -D env-attr-cleaner
```

## Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vite as envAttrCleaner } from 'env-attr-cleaner'

export default defineConfig({
    plugins: [
        vue(),
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

## Usage

```vue
<template>
    <form data-test-id="contact-form" @submit.prevent="handleSubmit">
        <input
            data-test-id="contact-name"
            data-test-class="form-input"
            type="text"
            v-model="name"
        >
        <input
            data-test-id="contact-email"
            data-test-class="form-input"
            type="email"
            v-model="email"
        >
        <textarea
            data-test-id="contact-message"
            data-test-class="form-input"
            v-model="message"
        ></textarea>
        <button
            data-test-id="contact-submit"
            data-test-class="form-button"
            type="submit"
        >
            Send
        </button>
    </form>
</template>
```

## Testing with Vitest + Vue Test Utils

```ts
// src/components/__tests__/ContactForm.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ContactForm from '../ContactForm.vue'

describe('ContactForm', () => {
    it('displays all fields', () => {
        const wrapper = mount(ContactForm)

        expect(wrapper.find('[data-test-id="contact-name"]').exists()).toBe(true)
        expect(wrapper.find('[data-test-id="contact-email"]').exists()).toBe(true)
        expect(wrapper.find('[data-test-id="contact-message"]').exists()).toBe(true)
    })

    it('has the correct number of fields', () => {
        const wrapper = mount(ContactForm)

        const inputs = wrapper.findAll('[data-test-class="form-input"]')
        expect(inputs).toHaveLength(3)
    })

    it('submits the form with data', async () => {
        const wrapper = mount(ContactForm)

        await wrapper.find('[data-test-id="contact-name"]').setValue('John')
        await wrapper.find('[data-test-id="contact-email"]').setValue('john@example.com')
        await wrapper.find('[data-test-id="contact-message"]').setValue('Hello')
        await wrapper.find('[data-test-id="contact-submit"]').trigger('click')

        expect(wrapper.emitted('submit')).toBeTruthy()
    })
})
```

## Testing with Playwright

```ts
// e2e/contact.spec.ts
import { test, expect } from '@playwright/test'

test('contact form submission', async ({ page }) => {
    await page.goto('/contact')

    await page.locator('[data-test-id="contact-name"]').fill('John')
    await page.locator('[data-test-id="contact-email"]').fill('john@example.com')
    await page.locator('[data-test-id="contact-message"]').fill('Hello')
    await page.locator('[data-test-id="contact-submit"]').click()

    await expect(page.locator('[data-test-id="success-message"]')).toBeVisible()
})
```

## Verify Production Build

```bash
# Build for production
pnpm build

# Check output
cat dist/index.html | grep "data-test"
# Should return nothing
```
