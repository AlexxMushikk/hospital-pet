import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Vitest hands back an empty string for `*.css?raw`, so stylesheets are read from disk.
const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readTree(dir, pattern) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return readTree(full, pattern)
        return pattern.test(entry.name) ? [[path.relative(srcDir, full), fs.readFileSync(full, 'utf8')]] : []
    })
}

const stylesheets = Object.fromEntries(readTree(srcDir, /\.css$/))
const scripts     = Object.fromEntries(readTree(srcDir, /^(?!.*\.test\.).*\.jsx?$/))

// A raw color outside the tokens would stay the same in every theme.
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\((?!\s*var\()|hsla?\(|:\s*(white|black)\b/

const offending = (files, pattern) => Object.entries(files).flatMap(([file, text]) =>
    text.split('\n')
        .map((line, i) => ({ line: line.trim(), n: i + 1 }))
        .filter(({ line }) => pattern.test(line))
        .map(({ line, n }) => `${file}:${n}  ${line}`)
)

describe('theming', () => {
    it('reads the real stylesheets', () => {
        expect(Object.keys(stylesheets).length).toBeGreaterThan(20)
        expect(stylesheets[path.join('styles', 'tokens.css')]).toContain('--color-primary')
    })

    it('keeps colors in tokens.css only', () => {
        const others = Object.fromEntries(
            Object.entries(stylesheets).filter(([f]) => !f.endsWith('tokens.css'))
        )
        expect(offending(others, RAW_COLOR)).toEqual([])
    })

    it('uses no hardcoded colors in inline styles', () => {
        expect(offending(scripts, /style=\{\{[^}]*(#[0-9a-fA-F]{3,8}|rgba?\()/)).toEqual([])
    })
})
