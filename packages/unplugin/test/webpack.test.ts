import { describe, it, expect } from 'vitest'
import { webpack } from '../src/index'

describe('webpack adapter', () => {
    it('returns a webpack plugin with an apply method', () => {
        const plugin = webpack()
        expect(plugin).toBeDefined()
        expect(typeof plugin.apply).toBe('function')
    })

    it('accepts custom environment config', () => {
        const plugin = webpack({ environments: { production: ['data-analytics-*'] } })
        expect(plugin).toBeDefined()
        expect(typeof plugin.apply).toBe('function')
    })
})
