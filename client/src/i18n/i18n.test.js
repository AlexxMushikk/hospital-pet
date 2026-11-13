import { describe, it, expect, afterEach } from 'vitest'

import i18n from './index'
import en from './en.json'
import pl from './pl.json'
import { detectLanguage, LANGUAGE_STORAGE_KEY } from './language'

const catalogs = { en, pl }

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

function flatKeys(obj, prefix = '') {
    return Object.entries(obj).flatMap(([key, value]) =>
        typeof value === 'object' ? flatKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
    )
}

const baseKeys = (catalog) => new Set(flatKeys(catalog).map(k => k.replace(PLURAL_SUFFIX, '')))

describe('detectLanguage', () => {
    it.each([
        ['a language chosen earlier wins',           'pl', ['en-US'],          'pl'],
        ['the browser language is used next',        null, ['pl-PL', 'en'],    'pl'],
        ['the first supported browser language wins', null, ['de-DE', 'en-GB'], 'en'],
        ['English is the default',                   null, ['ru-RU', 'de'],    'en'],
        ['a stale unsupported choice is ignored',    'ru', ['pl'],             'pl'],
        ['no information at all',                    null, [],                 'en'],
    ])('%s', (_name, stored, browser, expected) => {
        expect(detectLanguage(stored, browser)).toBe(expected)
    })
})

describe('catalogs', () => {
    it('en and pl translate the same set of keys', () => {
        expect([...baseKeys(pl)].sort()).toEqual([...baseKeys(en)].sort())
    })

    it.each(Object.keys(catalogs))('%s has every plural form its grammar needs', (lang) => {
        const needed = new Intl.PluralRules(lang).resolvedOptions().pluralCategories
        const keys   = flatKeys(catalogs[lang])
        const plural = [...new Set(keys.filter(k => PLURAL_SUFFIX.test(k)).map(k => k.replace(PLURAL_SUFFIX, '')))]

        const missing = plural.flatMap(base =>
            needed.filter(form => !keys.includes(`${base}_${form}`)).map(form => `${base}_${form}`)
        )
        expect(missing).toEqual([])
    })

    it('picks the Polish plural form by number', async () => {
        const t = i18n.getFixedT('pl')

        expect(t('validation.nameMin', { count: 1 })).not.toBe(t('validation.nameMin', { count: 2 }))
        expect(t('validation.nameMin', { count: 2 })).toBe(pl.validation.nameMin_few.replace('{{count}}', '2'))
        expect(t('validation.nameMin', { count: 5 })).toBe(pl.validation.nameMin_many.replace('{{count}}', '5'))
    })
})

describe('switching language', () => {
    afterEach(async () => {
        await i18n.changeLanguage('en')
    })

    it('remembers the choice and updates the page language', async () => {
        await i18n.changeLanguage('pl')

        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pl')
        expect(document.documentElement.lang).toBe('pl')
        expect(i18n.t('lang.switcherLabel')).toBe(pl.lang.switcherLabel)
    })
})
