import { describe, it, expect, afterEach } from 'vitest'

import i18n from '../i18n'
import en from '../i18n/en.json'
import pl from '../i18n/pl.json'
import { apiErrorMessage } from './apiError'
import { statusLabel } from './status'

const serverError = (data) => ({ response: { status: 400, data } })

afterEach(async () => {
    await i18n.changeLanguage('en')
})

describe('apiErrorMessage', () => {
    it('translates a server error code', () => {
        expect(apiErrorMessage(serverError({ code: 'errors.SLOT_TAKEN' }))).toBe(en.errors.SLOT_TAKEN)
    })

    it('fills in the params the server sent', () => {
        const msg = apiErrorMessage(serverError({ code: 'errors.SLOT_STEP', params: { minutes: 30 } }))

        expect(msg).toBe('Appointments start every 30 minutes')
    })

    it('uses the plural form that matches the count', async () => {
        await i18n.changeLanguage('pl')

        const msg = apiErrorMessage(serverError({ code: 'validation.nameMin', params: { count: 2 } }))

        expect(msg).toBe(pl.validation.nameMin_few.replace('{{count}}', '2'))
    })

    it('follows the current language', async () => {
        await i18n.changeLanguage('pl')

        expect(apiErrorMessage(serverError({ code: 'errors.PAST_DATE' }))).toBe(pl.errors.PAST_DATE)
    })

    it('reports a network failure when there is no response', () => {
        expect(apiErrorMessage(new Error('Network Error'))).toBe(en.errors.NETWORK)
    })

    it('falls back for an unknown or missing code', () => {
        expect(apiErrorMessage(serverError({ code: 'errors.SOMETHING_NEW' }))).toBe(en.errors.INTERNAL)
        expect(apiErrorMessage(serverError({ error: 'raw text' }))).toBe(en.errors.INTERNAL)
    })

    it('lets the caller pick the fallback', () => {
        expect(apiErrorMessage(serverError({}), 'errors.NOT_FOUND')).toBe(en.errors.NOT_FOUND)
    })
})

describe('statusLabel', () => {
    it('translates the status', async () => {
        expect(statusLabel('Completed')).toBe(en.status.Completed)
        await i18n.changeLanguage('pl')
        expect(statusLabel('Completed')).toBe(pl.status.Completed)
    })

    it('shows an unknown status as is', () => {
        expect(statusLabel('Past')).toBe('Past')
    })
})
