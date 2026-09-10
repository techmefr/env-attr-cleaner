import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { envAttrCleaner, loaderForPath, type IBunBuild, type TBunLoader } from '../src/index'

/**
 * Runs a plugin's setup and returns the registered onLoad handler, or null when the
 * plugin registered none. The previous suite captured `options.filter` and dropped the
 * callback, which left everything the plugin actually does — read the file, strip it,
 * pick a loader — at zero coverage.
 */
function registerOnLoad(plugin: ReturnType<typeof envAttrCleaner>): {
    filter: RegExp
    run: (path: string) => Promise<{ contents: string; loader: TBunLoader }>
} | null {
    let registered: {
        filter: RegExp
        run: (path: string) => Promise<{ contents: string; loader: TBunLoader }>
    } | null = null

    const build: IBunBuild = {
        onLoad(options, callback) {
            registered = {
                filter: options.filter,
                run: (path: string) => callback({ path }),
            }
        },
    }

    plugin.setup(build)

    return registered
}

describe('bun onLoad handler', () => {
    const originalEnv = process.env.NODE_ENV
    let directory: string

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'env-attr-cleaner-'))
    })

    afterEach(() => {
        process.env.NODE_ENV = originalEnv
        rmSync(directory, { recursive: true, force: true })
    })

    function writeSource(name: string, contents: string): string {
        const path = join(directory, name)
        writeFileSync(path, contents, 'utf8')
        return path
    }

    it('strips matched attributes from the file it loads', async () => {
        process.env.NODE_ENV = 'production'
        const handler = registerOnLoad(envAttrCleaner())
        const path = writeSource(
            'component.tsx',
            'export const Button = () => <button data-test-id="btn" className="primary">Go</button>\n',
        )

        const result = await handler!.run(path)

        expect(result.contents).toBe(
            'export const Button = () => <button className="primary">Go</button>\n',
        )
    })

    it('strips a JSX expression value, which this package used to leak', async () => {
        process.env.NODE_ENV = 'production'
        const handler = registerOnLoad(envAttrCleaner())
        const path = writeSource('component.tsx', '<button data-test-id={id}>Go</button>\n')

        const result = await handler!.run(path)

        expect(result.contents).toBe('<button>Go</button>\n')
    })

    it('honours a custom environment configuration', async () => {
        process.env.NODE_ENV = 'production'
        const handler = registerOnLoad(
            envAttrCleaner({ environments: { production: ['data-analytics-*'] } }),
        )
        const path = writeSource(
            'component.tsx',
            '<button data-analytics-id="a" data-test-id="btn">Go</button>\n',
        )

        const result = await handler!.run(path)

        expect(result.contents).toBe('<button data-test-id="btn">Go</button>\n')
    })

    it('registers no handler when the environment strips nothing', () => {
        process.env.NODE_ENV = 'development'

        expect(registerOnLoad(envAttrCleaner())).toBeNull()
    })

    it('only claims files bun can load', () => {
        process.env.NODE_ENV = 'production'
        const handler = registerOnLoad(envAttrCleaner())

        expect(handler!.filter.test('index.ts')).toBe(true)
        expect(handler!.filter.test('component.tsx')).toBe(true)
        expect(handler!.filter.test('script.mjs')).toBe(true)
        expect(handler!.filter.test('styles.css')).toBe(false)
        expect(handler!.filter.test('component.vue')).toBe(false)
        expect(handler!.filter.test('component.svelte')).toBe(false)
    })

    it('keeps the jsx loaders distinct from the plain ones', async () => {
        process.env.NODE_ENV = 'production'
        const handler = registerOnLoad(envAttrCleaner())

        expect((await handler!.run(writeSource('a.tsx', ''))).loader).toBe('tsx')
        expect((await handler!.run(writeSource('b.jsx', ''))).loader).toBe('jsx')
        expect((await handler!.run(writeSource('c.ts', ''))).loader).toBe('ts')
        expect((await handler!.run(writeSource('d.js', ''))).loader).toBe('js')
    })
})

describe('loaderForPath', () => {
    it.each([
        ['src/index.ts', 'ts'],
        ['src/App.tsx', 'tsx'],
        ['src/main.js', 'js'],
        ['src/App.jsx', 'jsx'],
        ['src/mod.mjs', 'js'],
        ['src/mod.cjs', 'js'],
    ])('maps %s to the %s loader', (path, loader) => {
        expect(loaderForPath(path)).toBe(loader)
    })

    it('falls back to js for an extension it does not know', () => {
        expect(loaderForPath('src/thing.weird')).toBe('js')
    })
})
