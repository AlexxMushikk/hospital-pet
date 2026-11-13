import { describe, it, expect, afterEach, vi } from 'vitest'

import { getTodayStr, formatDate, formatDateTime } from './date'

describe('getTodayStr', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns the local calendar day, not the UTC one', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2030-03-15T00:30:00+01:00'))

        const offsetSpy = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60)

        expect(getTodayStr()).toBe('2030-03-15')

        offsetSpy.mockRestore()
    })
})

describe('formatDate', () => {
    it('hands back unparseable input untouched', () => {
        expect(formatDate('not a date')).toBe('not a date')
        expect(formatDate('')).toBe('')
    })
})

describe('formatDateTime', () => {
    it('falls back to the raw values when the pair cannot be parsed', () => {
        expect(formatDateTime('nonsense', '99:99')).toBe('nonsense | 99:99')
    })
})
