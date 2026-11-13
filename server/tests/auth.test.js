import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'

import createApp from '../app.js'
import { db, resetDb } from './helpers/db.js'
import { createPatient, createDoctor } from './helpers/fixtures.js'

const app = createApp()

function refreshCookie(res) {
    const raw = res.headers['set-cookie'].find(c => c.startsWith('refreshToken='))
    return raw.split(';')[0]
}

beforeEach(() => {
    resetDb()
})

describe('POST /api/register', () => {
    it('creates a user and a patient row in one transaction', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ email: 'new@test.com', password: 'testtest', full_name: 'New Patient' })

        expect(res.status).toBe(201)

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get('new@test.com')
        expect(user.role).toBe('patient')
        expect(user.password).not.toBe('testtest')

        const patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id)
        expect(patient.full_name).toBe('New Patient')
    })

    it('rejects a duplicate email', async () => {
        createPatient({ email: 'taken@test.com' })

        const res = await request(app)
            .post('/api/register')
            .send({ email: 'taken@test.com', password: 'testtest', full_name: 'Impostor' })

        expect(res.status).toBe(400)
        expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(1)
    })

    it('rejects a short password with 400, not 500', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ email: 'new@test.com', password: 'abc', full_name: 'New Patient' })

        expect(res.status).toBe(400)
        expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(0)
    })

    it('lets the new account log in with the chosen password', async () => {
        await request(app)
            .post('/api/register')
            .send({ email: 'new@test.com', password: 'testtest', full_name: 'New Patient' })

        const res = await request(app)
            .post('/api/login')
            .send({ email: 'new@test.com', password: 'testtest' })

        expect(res.status).toBe(200)
        expect(res.body.user).toMatchObject({ role: 'patient', full_name: 'New Patient', doctor_id: null })
        expect(res.body.user.patient_id).toEqual(expect.any(Number))
    })

    describe('email of a deleted account', () => {
        let old

        beforeEach(() => {
            old = createPatient({ email: 'back@test.com', fullName: 'Old Account' })
            db.prepare(`UPDATE users SET deleted_at = datetime('now') WHERE id = ?`).run(old.id)
        })

        it('can be registered again as a fresh account', async () => {
            const res = await request(app)
                .post('/api/register')
                .send({ email: 'back@test.com', password: 'newpass1', full_name: 'Returning Patient' })

            expect(res.status).toBe(201)

            const login = await request(app)
                .post('/api/login')
                .send({ email: 'back@test.com', password: 'newpass1' })
            expect(login.status).toBe(200)
            expect(login.body.user.id).not.toBe(old.id)
            expect(login.body.user.full_name).toBe('Returning Patient')
        })

        it('leaves the old account deleted, under a released address', async () => {
            await request(app)
                .post('/api/register')
                .send({ email: 'back@test.com', password: 'newpass1', full_name: 'Returning Patient' })

            const row = db.prepare('SELECT email, deleted_at FROM users WHERE id = ?').get(old.id)
            expect(row.deleted_at).not.toBeNull()
            expect(row.email).toBe(`deleted-${old.id}-back@test.com`)
        })
    })

    it('ignores a role sent by the client', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ email: 'esc@test.com', password: 'testtest', full_name: 'Escalator', role: 'admin' })

        expect(res.status).toBe(201)
        expect(db.prepare('SELECT role FROM users WHERE email = ?').get('esc@test.com').role).toBe('patient')
    })

    it('rejects a malformed email with 400', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ email: 'not-an-email', password: 'testtest', full_name: 'New Patient' })

        expect(res.status).toBe(400)
    })
})

describe('POST /api/login', () => {
    it('returns the user, an access token and an httpOnly refresh cookie', async () => {
        const patient = createPatient()

        const res = await request(app)
            .post('/api/login')
            .send({ email: patient.email, password: patient.password })

        expect(res.status).toBe(200)
        expect(res.body.accessToken).toBeTruthy()
        expect(res.body.user).toMatchObject({
            id:         patient.id,
            email:      patient.email,
            role:       'patient',
            patient_id: patient.patient_id,
        })
        expect(res.body.user.password).toBeUndefined()

        const cookie = res.headers['set-cookie'].find(c => c.startsWith('refreshToken='))
        expect(cookie).toContain('HttpOnly')
        expect(cookie).toContain('SameSite=Strict')
    })

    it('stores the refresh token hashed, never in clear text', async () => {
        const patient = createPatient()

        const res = await request(app)
            .post('/api/login')
            .send({ email: patient.email, password: patient.password })

        const raw   = refreshCookie(res).replace('refreshToken=', '')
        const rows  = db.prepare('SELECT * FROM refresh_tokens').all()

        expect(rows).toHaveLength(1)
        expect(rows[0].user_id).toBe(patient.id)
        expect(rows[0].token_hash).not.toBe(raw)
        expect(rows[0].token_hash).toHaveLength(64)
    })

    it('tells the client which doctor profile belongs to a doctor account', async () => {
        const doctor = createDoctor()

        const res = await request(app)
            .post('/api/login')
            .send({ email: doctor.email, password: doctor.password })

        expect(res.status).toBe(200)
        expect(res.body.user).toMatchObject({ role: 'doctor', doctor_id: doctor.doctor_id })
    })

    it('rejects a wrong password with 401', async () => {
        const patient = createPatient()

        const res = await request(app)
            .post('/api/login')
            .send({ email: patient.email, password: 'wrongpass' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Invalid credentials')
    })

    it('rejects an unknown email with 401', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ email: 'ghost@test.com', password: 'testtest' })

        expect(res.status).toBe(401)
    })

    it('refuses a soft-deleted user', async () => {
        const patient = createPatient()
        db.prepare(`UPDATE users SET deleted_at = datetime('now') WHERE id = ?`).run(patient.id)

        const res = await request(app)
            .post('/api/login')
            .send({ email: patient.email, password: patient.password })

        expect(res.status).toBe(401)
    })
})

describe('POST /api/refresh', () => {
    async function login() {
        const patient = createPatient()
        const res = await request(app)
            .post('/api/login')
            .send({ email: patient.email, password: patient.password })
        return { patient, cookie: refreshCookie(res) }
    }

    it('issues a new access token and rotates the refresh cookie', async () => {
        const { patient, cookie } = await login()

        const res = await request(app).post('/api/refresh').set('Cookie', cookie)

        expect(res.status).toBe(200)
        expect(res.body.accessToken).toBeTruthy()
        expect(res.body.user.id).toBe(patient.id)
        expect(refreshCookie(res)).not.toBe(cookie)

        // Old row revoked, new row active.
        const rows = db.prepare('SELECT revoked FROM refresh_tokens ORDER BY id').all()
        expect(rows.map(r => r.revoked)).toEqual([1, 0])
    })

    // Pushes every stored token back in time, as if the last rotation happened a while ago.
    const ageTokens = (seconds) => db
        .prepare(`UPDATE refresh_tokens SET created_at = datetime(created_at, ?)`)
        .run(`-${seconds} seconds`)

    it('revokes every session when a used token is replayed', async () => {
        const { cookie } = await login()

        await request(app).post('/api/refresh').set('Cookie', cookie)
        ageTokens(60)

        const replay = await request(app).post('/api/refresh').set('Cookie', cookie)

        expect(replay.status).toBe(401)
        expect(replay.body.error).toBe('Session revoked')

        const active = db.prepare('SELECT COUNT(*) AS n FROM refresh_tokens WHERE revoked = 0').get().n
        expect(active).toBe(0)
    })

    it('lets a second tab refresh with the same token moments later', async () => {
        const { cookie } = await login()

        const tabA = await request(app).post('/api/refresh').set('Cookie', cookie)
        const tabB = await request(app).post('/api/refresh').set('Cookie', cookie)

        expect(tabA.status).toBe(200)
        expect(tabB.status).toBe(200)
        expect(tabB.body.accessToken).toBeTruthy()

        // Both tabs keep a working session afterwards.
        const nextA = await request(app).post('/api/refresh').set('Cookie', refreshCookie(tabA))
        const nextB = await request(app).post('/api/refresh').set('Cookie', refreshCookie(tabB))
        expect(nextA.status).toBe(200)
        expect(nextB.status).toBe(200)
    })

    it('does not bring back a session that was ended by logout', async () => {
        const { cookie } = await login()

        await request(app).post('/api/logout').set('Cookie', cookie)
        const res = await request(app).post('/api/refresh').set('Cookie', cookie)

        expect(res.status).toBe(401)
        expect(db.prepare('SELECT COUNT(*) AS n FROM refresh_tokens WHERE revoked = 0').get().n).toBe(0)
    })

    it('ends the session of a user deleted after logging in', async () => {
        const { patient, cookie } = await login()
        db.prepare(`UPDATE users SET deleted_at = datetime('now') WHERE id = ?`).run(patient.id)

        const res = await request(app).post('/api/refresh').set('Cookie', cookie)

        expect(res.status).toBe(401)
        expect(res.body.code).toBe('errors.USER_NOT_FOUND')
    })

    it('rejects a request with no cookie', async () => {
        const res = await request(app).post('/api/refresh')

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Refresh token required')
    })

    it('rejects a forged token', async () => {
        const res = await request(app).post('/api/refresh').set('Cookie', 'refreshToken=garbage')

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Invalid refresh token')
    })

    it('rejects a well-formed token that was never stored', async () => {
        const { cookie } = await login()
        db.prepare('DELETE FROM refresh_tokens').run()

        const res = await request(app).post('/api/refresh').set('Cookie', cookie)

        expect(res.status).toBe(401)
    })
})

describe('POST /api/logout', () => {
    it('revokes the presented token and clears the cookie', async () => {
        const patient = createPatient()
        const login   = await request(app)
            .post('/api/login')
            .send({ email: patient.email, password: patient.password })

        const res = await request(app).post('/api/logout').set('Cookie', refreshCookie(login))

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT revoked FROM refresh_tokens').get().revoked).toBe(1)

        const cleared = res.headers['set-cookie'].find(c => c.startsWith('refreshToken='))
        expect(cleared).toMatch(/refreshToken=;/)
    })

    it('is a no-op without a cookie', async () => {
        const res = await request(app).post('/api/logout')

        expect(res.status).toBe(200)
    })
})
