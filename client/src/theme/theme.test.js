import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import indexHtml from '../../index.html?raw'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    resolveTheme, setTheme, initTheme, currentTheme, subscribeTheme, THEME_STORAGE_KEY,
} from './theme'

// Vitest returns an empty string for `*.css?raw`, so the tokens are read from disk.
const here      = path.dirname(fileURLToPath(import.meta.url))
const tokensCss = fs.readFileSync(path.join(here, '..', 'styles', 'tokens.css'), 'utf8')

// A controllable stand-in for matchMedia('(prefers-color-scheme: dark)').
function mockSystem(prefersDark) {
    const listeners = new Set()
    const query = {
        matches: prefersDark,
        addEventListener: (_, fn) => listeners.add(fn),
        removeEventListener: (_, fn) => listeners.delete(fn),
    }
    vi.stubGlobal('matchMedia', vi.fn(() => query))
    return {
        change(dark) {
            query.matches = dark
            listeners.forEach(fn => fn({ matches: dark }))
        },
    }
}

let stop = () => {}

beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
})

afterEach(() => {
    stop()
    vi.unstubAllGlobals()
})

describe('resolveTheme', () => {
    it.each([
        ['a saved choice wins over the system', 'light', true,  'light'],
        ['the system decides without a choice', null,    true,  'dark'],
        ['light is the fallback',               null,    false, 'light'],
        ['a broken saved value is ignored',     'neon',  true,  'dark'],
    ])('%s', (_name, stored, systemDark, expected) => {
        expect(resolveTheme(stored, systemDark)).toBe(expected)
    })
})

describe('theme state', () => {
    it('follows the system until the user picks a theme', () => {
        const system = mockSystem(false)
        stop = initTheme()
        expect(currentTheme()).toBe('light')

        system.change(true)
        expect(currentTheme()).toBe('dark')
    })

    it('remembers an explicit choice and stops following the system', () => {
        const system = mockSystem(false)
        stop = initTheme()

        setTheme('dark')
        expect(document.documentElement.dataset.theme).toBe('dark')
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

        system.change(false)
        expect(currentTheme()).toBe('dark')
    })

    it('notifies subscribers when the theme changes', () => {
        mockSystem(false)
        stop = initTheme()
        const listener = vi.fn()
        const unsubscribe = subscribeTheme(listener)

        setTheme('dark')
        setTheme('dark')

        expect(listener).toHaveBeenCalledTimes(1)
        unsubscribe()
    })

    it('ignores an unknown theme', () => {
        mockSystem(false)
        stop = initTheme()

        setTheme('neon')

        expect(currentTheme()).toBe('light')
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    })
})

describe('first paint', () => {
    it('index.html reads the same storage key before the app loads', () => {
        expect(indexHtml).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`)
        expect(indexHtml).toContain("setAttribute('data-theme'")
    })
})

describe('tokens', () => {
    const block = (selector) => {
        const start = tokensCss.indexOf(selector)
        const body  = tokensCss.slice(tokensCss.indexOf('{', start), tokensCss.indexOf('}', start))
        return new Set([...body.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]))
    }

    it('the dark theme redefines every token of the light one', () => {
        const light = block(':root[data-theme="light"]')
        const dark  = block(':root[data-theme="dark"]')

        expect(light.size).toBeGreaterThan(20)
        expect([...light].filter(name => !dark.has(name))).toEqual([])
    })
})
