import { describe, it, expect, afterEach } from 'vitest'

import i18n from '../i18n'
import { formatExperience, formatExperienceShort } from './experience'

afterEach(async () => {
    await i18n.changeLanguage('en')
})

describe('formatExperience in English', () => {
    it.each([
        [{ years: 1,  months: 0 }, '1 year'],
        [{ years: 5,  months: 0 }, '5 years'],
        [{ years: 2,  months: 1 }, '2 years 1 month'],
        [{ years: 0,  months: 3 }, '3 months'],
        [{ years: 0,  months: 0 }, 'less than a month'],
    ])('%o → %s', (experience, expected) => {
        expect(formatExperience(experience)).toBe(expected)
    })
})

describe('formatExperience in Polish', () => {
    it.each([
        [{ years: 1,  months: 0 }, '1 rok'],
        [{ years: 3,  months: 0 }, '3 lata'],
        [{ years: 5,  months: 0 }, '5 lat'],
        [{ years: 12, months: 0 }, '12 lat'],
        [{ years: 22, months: 0 }, '22 lata'],
        [{ years: 2,  months: 5 }, '2 lata 5 miesięcy'],
        [{ years: 0,  months: 0 }, 'mniej niż miesiąc'],
    ])('%o → %s', async (experience, expected) => {
        await i18n.changeLanguage('pl')
        expect(formatExperience(experience)).toBe(expected)
    })
})

describe('formatExperienceShort', () => {
    it('shows whole years only', () => {
        expect(formatExperienceShort({ years: 12, months: 7 })).toBe('12 years')
    })

    it('says "less than a year" in the first year', () => {
        expect(formatExperienceShort({ years: 0, months: 11 })).toBe('less than a year')
    })

    it('returns null when the server sent no experience', () => {
        expect(formatExperience(null)).toBeNull()
        expect(formatExperienceShort(null)).toBeNull()
    })
})
