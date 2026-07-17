import { describe, it, expect, afterEach } from 'vitest'
import { vite } from '../src/index'
import type { Plugin } from 'vite'

describe('vite adapter', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
        process.env.NODE_ENV = originalEnv
    })

    it('returns a plugin with the correct name', () => {
        const plugin = vite() as Plugin
        expect(plugin.name).toBe('env-attr-cleaner')
    })

    it('sets enforce to pre', () => {
        const plugin = vite() as Plugin
        expect(plugin.enforce).toBe('pre')
    })

    describe('transformIndexHtml', () => {
        it('strips data-test-* and data-debug-* in production', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite() as Plugin
            const html = '<button data-test-id="btn" data-test-class="primary">Click</button>'
            const result = (plugin.transformIndexHtml as (html: string) => string)(html)
            expect(result).toBe('<button>Click</button>')
        })

        it('preserves framework data attributes in production', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite() as Plugin
            const html = '<div data-test-id="form" data-hx-post="/api" data-x-show="open">Form</div>'
            const result = (plugin.transformIndexHtml as (html: string) => string)(html)
            expect(result).toBe('<div data-hx-post="/api" data-x-show="open">Form</div>')
        })

        it('keeps all data-* attributes in development', () => {
            process.env.NODE_ENV = 'development'
            const plugin = vite() as Plugin
            const html = '<button data-test-id="btn">Click</button>'
            const result = (plugin.transformIndexHtml as (html: string) => string)(html)
            expect(result).toBe('<button data-test-id="btn">Click</button>')
        })

        it('strips custom patterns when configured', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite({ environments: { production: ['data-analytics-*'] } }) as Plugin
            const html = '<button data-test-id="btn" data-analytics-event="click">Click</button>'
            const result = (plugin.transformIndexHtml as (html: string) => string)(html)
            expect(result).toBe('<button data-test-id="btn">Click</button>')
        })

        it('strips data-test-* and data-debug-* in staging', () => {
            process.env.NODE_ENV = 'staging'
            const plugin = vite() as Plugin
            const html = '<div data-test-id="box" data-debug-state="open" data-hx-get="/api">Content</div>'
            const result = (plugin.transformIndexHtml as (html: string) => string)(html)
            expect(result).toBe('<div data-hx-get="/api">Content</div>')
        })
    })

    describe('transform', () => {
        type TransformFn = (
            code: string,
            id: string,
        ) => { code: string; map: { mappings: string } } | null | undefined

        it('strips data-test-* from .vue files in production', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite() as Plugin
            const code = '<template><button data-test-id="btn">Click</button></template>'
            const result = (plugin.transform as TransformFn)(code, 'component.vue')
            expect(result?.code).toBe('<template><button>Click</button></template>')
        })

        it('returns a sourcemap when code is transformed', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite() as Plugin
            const code = '<template><button data-test-id="btn">Click</button></template>'
            const result = (plugin.transform as TransformFn)(code, 'component.vue')
            expect(result?.map).toBeDefined()
            expect(result?.map.mappings.length).toBeGreaterThan(0)
        })

        it('ignores non-component files like CSS', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite() as Plugin
            const result = (plugin.transform as TransformFn)('.btn { color: red }', 'styles.css')
            expect(result).toBeFalsy()
        })

        it('strips data-test-* from .tsx files in production', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite() as Plugin
            const code = '<button data-test-id="btn">Click</button>'
            const result = (plugin.transform as TransformFn)(code, 'Component.tsx')
            expect(result?.code).toBe('<button>Click</button>')
        })

        it('strips data-test-* from .svelte files in production', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite() as Plugin
            const code = '<button data-test-id="btn">Click</button>'
            const result = (plugin.transform as TransformFn)(code, 'App.svelte')
            expect(result?.code).toBe('<button>Click</button>')
        })

        it('returns null for .vue files in development so sourcemaps are untouched', () => {
            process.env.NODE_ENV = 'development'
            const plugin = vite() as Plugin
            const code = '<template><button data-test-id="btn">Click</button></template>'
            const result = (plugin.transform as TransformFn)(code, 'component.vue')
            expect(result).toBeNull()
        })

        it('returns null in production when nothing matches', () => {
            process.env.NODE_ENV = 'production'
            const plugin = vite() as Plugin
            const code = '<template><button class="btn">Click</button></template>'
            const result = (plugin.transform as TransformFn)(code, 'component.vue')
            expect(result).toBeNull()
        })
    })
})
