import { describe, it, expect } from 'vitest'

import { formatExperience, formatExperienceShort } from './experience'

describe('formatExperience', () => {
    it.each([
        [{ years: 1,  months: 0 }, '1 год'],
        [{ years: 3,  months: 0 }, '3 года'],
        [{ years: 5,  months: 0 }, '5 лет'],
        [{ years: 11, months: 0 }, '11 лет'],
        [{ years: 14, months: 0 }, '14 лет'],
        [{ years: 21, months: 0 }, '21 год'],
        [{ years: 22, months: 0 }, '22 года'],
    ])('declines years: %o → %s', (experience, expected) => {
        expect(formatExperience(experience)).toBe(expected)
    })

    it('joins years and months', () => {
        expect(formatExperience({ years: 2, months: 1 })).toBe('2 года 1 месяц')
        expect(formatExperience({ years: 1, months: 5 })).toBe('1 год 5 месяцев')
    })

    it('shows only months for a doctor in the first year', () => {
        expect(formatExperience({ years: 0, months: 3 })).toBe('3 месяца')
    })

    it('says "less than a month" for a brand-new doctor', () => {
        expect(formatExperience({ years: 0, months: 0 })).toBe('менее месяца')
    })

    it('returns null when the server sent no experience', () => {
        expect(formatExperience(null)).toBeNull()
    })
})

describe('formatExperienceShort', () => {
    it('shows whole years only', () => {
        expect(formatExperienceShort({ years: 12, months: 7 })).toBe('12 лет')
    })

    it('says "less than a year" in the first year', () => {
        expect(formatExperienceShort({ years: 0, months: 11 })).toBe('менее года')
    })
})
