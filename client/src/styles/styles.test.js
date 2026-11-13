import { describe, it, expect } from 'vitest'

const stylesheets = import.meta.glob('../**/*.css', { query: '?raw', import: 'default', eager: true })
const scripts     = import.meta.glob(['../**/*.{js,jsx}', '!../**/*.test.{js,jsx}'], {
    query: '?raw', import: 'default', eager: true,
})

// A raw color outside the tokens would stay the same in every theme.
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\((?!\s*var\()|hsla?\(|:\s*(white|black)\b/

const offending = (files, pattern) => Object.entries(files).flatMap(([file, text]) =>
    text.split('\n')
        .map((line, i) => ({ line: line.trim(), n: i + 1 }))
        .filter(({ line }) => pattern.test(line))
        .map(({ line, n }) => `${file}:${n}  ${line}`)
)

describe('theming', () => {
    it('finds the stylesheets', () => {
        expect(Object.keys(stylesheets).length).toBeGreaterThan(20)
    })

    it('keeps colors in tokens.css only', () => {
        const others = Object.fromEntries(Object.entries(stylesheets).filter(([f]) => !f.endsWith('/tokens.css')))
        expect(offending(others, RAW_COLOR)).toEqual([])
    })

    it('uses no hardcoded colors in inline styles', () => {
        expect(offending(scripts, /style=\{\{[^}]*(#[0-9a-fA-F]{3,8}|rgba?\()/)).toEqual([])
    })
})
