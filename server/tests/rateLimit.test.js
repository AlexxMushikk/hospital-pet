import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createRequire } from 'node:module'

import createApp from '../app.js'
import { resetDb } from './helpers/db.js'
import { createPatient } from './helpers/fixtures.js'

const require = createRequire(import.meta.url)
const { LOGIN_MAX_FAILED_ATTEMPTS, AUTH_RATE_WINDOW_MINUTES } = require('../constants.js')

const LIMITS = { windowMinutes: 15, login: 3, register: 2 }

let app, patient

// A fresh app per test, so every test starts with empty counters.
beforeEach(() => {
    resetDb()
    app     = createApp({ authLimits: LIMITS })
    patient = createPatient()
})

const login = (email, password) =>
    request(app).post('/api/login').send({ email, password })

async function failLogins(email, times) {
    for (let i = 0; i < times; i++) {
        const res = await login(email, 'wrong-password')
        expect(res.status).toBe(401)
    }
}

describe('login rate limit', () => {
    it('blocks the account after too many failed attempts, even with the right password', async () => {
        await failLogins(patient.email, LIMITS.login)

        const res = await login(patient.email, patient.password)

        expect(res.status).toBe(429)
        expect(res.body.code).toBe('errors.TOO_MANY_ATTEMPTS')
        expect(res.body.params).toEqual({ minutes: LIMITS.windowMinutes })
        expect(res.headers['retry-after']).toBeDefined()
    })

    it('does not count successful logins', async () => {
        for (let i = 0; i < LIMITS.login + 2; i++) {
            const res = await login(patient.email, patient.password)
            expect(res.status).toBe(200)
        }
    })

    it('lets the user back in when a failure is followed by a success before the limit', async () => {
        await failLogins(patient.email, LIMITS.login - 1)

        expect((await login(patient.email, patient.password)).status).toBe(200)
    })

    it('keeps one account’s failures from locking out another', async () => {
        const other = createPatient({ email: 'other@test.com' })
        await failLogins(patient.email, LIMITS.login)

        expect((await login(other.email, other.password)).status).toBe(200)
    })

    it('counts the email regardless of case', async () => {
        await failLogins(patient.email, LIMITS.login - 1)
        await failLogins(patient.email.toUpperCase(), 1)

        expect((await login(patient.email, patient.password)).status).toBe(429)
    })

    it('applies the production limit when none is given', async () => {
        app = createApp()

        await failLogins(patient.email, LOGIN_MAX_FAILED_ATTEMPTS)
        const res = await login(patient.email, patient.password)

        expect(res.status).toBe(429)
        expect(res.body.params).toEqual({ minutes: AUTH_RATE_WINDOW_MINUTES })
    })
})

describe('sign-up rate limit', () => {
    it('blocks sign-ups from one address after the limit', async () => {
        for (let i = 0; i < LIMITS.register; i++) {
            const res = await request(app)
                .post('/api/register')
                .send({ email: `new${i}@test.com`, password: 'testtest', full_name: 'New Patient' })
            expect(res.status).toBe(201)
        }

        const res = await request(app)
            .post('/api/register')
            .send({ email: 'late@test.com', password: 'testtest', full_name: 'Late Patient' })

        expect(res.status).toBe(429)
        expect(res.body.code).toBe('errors.TOO_MANY_ATTEMPTS')
    })

    it('leaves the other endpoints alone', async () => {
        await failLogins(patient.email, LIMITS.login)

        expect((await request(app).get('/api/doctors')).status).toBe(200)
    })
})

describe('switching the limits off', () => {
    it('lets every attempt through', async () => {
        app = createApp({ authLimits: false })

        await failLogins(patient.email, LOGIN_MAX_FAILED_ATTEMPTS + 2)
        expect((await login(patient.email, patient.password)).status).toBe(200)
    })
})

describe('security headers', () => {
    it('sends the helmet headers', async () => {
        const res = await request(app).get('/api/doctors')

        expect(res.headers['x-content-type-options']).toBe('nosniff')
        expect(res.headers['x-powered-by']).toBeUndefined()
    })
})
