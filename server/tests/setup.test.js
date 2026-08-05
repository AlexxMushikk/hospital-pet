import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'

import createApp from '../app.js'
import { db, resetDb } from './helpers/db.js'
import { createPatient, authHeader } from './helpers/fixtures.js'

const app = createApp()

beforeEach(() => {
    resetDb()
})

describe('test harness', () => {
    it('runs against an in-memory database, not the development file', () => {
        expect(process.env.DB_PATH).toBe(':memory:')
        expect(db.memory).toBe(true)
    })

    it('has the full schema applied', () => {
        const tables = db
            .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
            .all()
            .map(row => row.name)

        expect(tables).toEqual(expect.arrayContaining([
            'users', 'patients', 'doctors', 'appointments', 'refresh_tokens',
            'specializations', 'languages', 'doctor_languages',
        ]))
    })

    it('starts each test with an empty database', () => {
        expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(0)
        createPatient()
        expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(1)
    })

    it('enforces foreign keys', () => {
        expect(() =>
            db.prepare(`INSERT INTO patients (user_id, full_name) VALUES (9999, 'Ghost')`).run()
        ).toThrow(/FOREIGN KEY/i)
    })
})

describe('app wiring', () => {
    it('serves public routes', async () => {
        const res = await request(app).get('/api/stats/public')

        expect(res.status).toBe(200)
    })

    it('404s unknown API routes as JSON', async () => {
        const res = await request(app).get('/api/nope')

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('Not found')
    })

    it('turns thrown service errors into their status code', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ email: 'nobody@test.com', password: 'testtest' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Invalid credentials')
    })

    it('accepts tokens minted by the fixtures', async () => {
        const patient = createPatient()

        const res = await request(app)
            .get(`/api/appointments/patient/${patient.patient_id}`)
            .set(authHeader(patient))

        expect(res.status).toBe(200)
        expect(res.body).toEqual([])
    })
})

describe('regression: zod 4 validation errors', () => {
    it('rejects a short password with 400, not 500', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ email: 'patient@test.com', password: 'abc' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeTruthy()
    })
})
