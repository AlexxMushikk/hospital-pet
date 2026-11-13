import { describe, it, expect } from 'vitest'

import en from './en.json'
import pl from './pl.json'
import { SPECIALIZATIONS } from '../constants'

// Every source file of the app, as text (tests excluded).
const sources = import.meta.glob(['../**/*.{js,jsx}', '!../**/*.test.{js,jsx}'], {
    query: '?raw', import: 'default', eager: true,
})

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

function flatKeys(obj, prefix = '') {
    return Object.entries(obj).flatMap(([key, value]) =>
        typeof value === 'object' ? flatKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
    )
}

const known    = new Set(flatKeys(en).map(k => k.replace(PLURAL_SUFFIX, '')))
const sections = Object.keys(en)

// Any quoted literal that starts with a catalog section, e.g. 'nav.home' or "validation.priceNegative".
const KEY_LITERAL = new RegExp(`['"\`]((?:${sections.join('|')})\\.[A-Za-z0-9_. ]+?)['"\`]`, 'g')

describe('translation coverage', () => {
    it('finds the app sources', () => {
        expect(Object.keys(sources).length).toBeGreaterThan(20)
    })

    it('leaves no Cyrillic text in the app', () => {
        const offenders = Object.entries(sources)
            .filter(([, text]) => /[Ѐ-ӿ]/.test(text))
            .map(([file]) => file)

        expect(offenders).toEqual([])
    })

    it('draws icons with SVG, not emoji or arrow characters', () => {
        // Pictographs render differently on every OS; lucide-react icons are used instead.
        // © ® ™ are ordinary typography, even though Unicode lists them as pictographs.
        const PICTOGRAPH = /(?![©®™])\p{Extended_Pictographic}|[←-⇿■-◿]/u
        const texts = { ...sources, 'en.json': JSON.stringify(en), 'pl.json': JSON.stringify(pl) }

        const offenders = Object.entries(texts).flatMap(([file, text]) =>
            text.split('\n').filter(line => PICTOGRAPH.test(line)).map(line => `${file}: ${line.trim().slice(0, 80)}`)
        )

        expect(offenders).toEqual([])
    })

    it('uses only keys that exist in the catalog', () => {
        const missing = Object.entries(sources).flatMap(([file, text]) =>
            [...text.matchAll(KEY_LITERAL)]
                .map(m => m[1])
                .filter(key => !known.has(key))
                .map(key => `${file}: ${key}`)
        )

        expect(missing).toEqual([])
    })

    it('translates every specialization, status and gender the app shows', () => {
        const needed = [
            ...SPECIALIZATIONS.flatMap(s => [`spec.${s.value}.label`, `spec.${s.value}.desc`]),
            ...['Scheduled', 'Completed', 'Cancelled'].map(s => `status.${s}`),
            ...['Male', 'Female', 'Not Specified'].map(g => `gender.${g}`),
        ]

        expect(needed.filter(key => !known.has(key))).toEqual([])
    })
})
