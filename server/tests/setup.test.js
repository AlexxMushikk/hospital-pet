import { describe, it, expect } from 'vitest'
import request from 'supertest'

import createApp from '../app.js'
import { db } from './helpers/db.js'

const app = createApp()

describe('test harness', () => {
    it('runs against an in-memory database, not the development file', () => {
        expect(process.env.DB_PATH).toBe(':memory:')
        expect(db.memory).toBe(true)
    })

    it('enforces foreign keys', () => {
        expect(() =>
            db.prepare(`INSERT INTO patients (user_id, full_name) VALUES (9999, 'Ghost')`).run()
        ).toThrow(/FOREIGN KEY/i)
    })
})

describe('app wiring', () => {
    it('404s unknown API routes as JSON', async () => {
        const res = await request(app).get('/api/nope')

        expect(res.status).toBe(404)
        expect(res.body).toEqual({ error: 'Not found', code: 'errors.NOT_FOUND' })
    })
})
