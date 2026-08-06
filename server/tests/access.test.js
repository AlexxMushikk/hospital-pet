import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import createApp from '../app.js'
import { resetDb } from './helpers/db.js'
import { createPatient, createDoctor, createAdmin, createAppointment, authHeader } from './helpers/fixtures.js'

const app = createApp()

function expiredHeader(user) {
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, patient_id: user.patient_id, doctor_id: user.doctor_id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: -10 },
    )
    return { Authorization: `Bearer ${token}` }
}

beforeEach(() => {
    resetDb()
})

describe('token handling', () => {
    it('401s a protected route with no token — the client should refresh', async () => {
        const res = await request(app).get('/api/appointments/1')

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Access token required')
    })

    it('401s an expired token, so the client knows to refresh', async () => {
        const patient = createPatient()

        const res = await request(app).get('/api/appointments/1').set(expiredHeader(patient))

        expect(res.status).toBe(401)
    })

    it('403s a token signed with the wrong secret', async () => {
        const forged = jwt.sign({ id: 1, role: 'admin' }, 'not_the_real_secret')

        const res = await request(app).get('/api/admin/patients').set({ Authorization: `Bearer ${forged}` })

        expect(res.status).toBe(403)
    })

    it('403s a malformed token', async () => {
        const res = await request(app).get('/api/appointments/1').set({ Authorization: 'Bearer garbage' })

        expect(res.status).toBe(403)
    })
})

describe('admin routes', () => {
    it('are closed to patients and doctors', async () => {
        const patient = createPatient()
        const doctor  = createDoctor()

        const asPatient = await request(app).get('/api/admin/patients').set(authHeader(patient))
        const asDoctor  = await request(app).get('/api/admin/patients').set(authHeader(doctor))

        expect(asPatient.status).toBe(403)
        expect(asDoctor.status).toBe(403)
    })

    it('are open to admins', async () => {
        const admin = createAdmin()

        const res = await request(app).get('/api/admin/patients').set(authHeader(admin))

        expect(res.status).toBe(200)
    })

    it('reject tables outside the allow list', async () => {
        const admin = createAdmin()

        const res = await request(app).get('/api/admin/users').set(authHeader(admin))

        expect(res.status).toBe(400)
    })

    it('refuse to delete the system administrator', async () => {
        const admin = createAdmin()

        const res = await request(app).delete(`/api/admin/patients/${admin.patient_id}`).set(authHeader(admin))

        expect(res.status).toBe(409)
    })
})

describe('appointment ownership', () => {
    let doctor, patient, stranger, appointmentId

    beforeEach(() => {
        doctor        = createDoctor()
        patient       = createPatient()
        stranger      = createPatient({ email: 'stranger@test.com' })
        appointmentId = createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id })
    })

    it('hides one patient visit from another patient', async () => {
        const res = await request(app).get(`/api/appointments/${appointmentId}`).set(authHeader(stranger))

        expect(res.status).toBe(403)
    })

    it('hides one patient list from another patient', async () => {
        const res = await request(app)
            .get(`/api/appointments/patient/${patient.patient_id}`)
            .set(authHeader(stranger))

        expect(res.status).toBe(403)
    })

    it('stops a stranger from editing a visit', async () => {
        const res = await request(app)
            .patch(`/api/appointments/${appointmentId}`)
            .set(authHeader(stranger))
            .send({ status: 'Cancelled' })

        expect(res.status).toBe(403)
    })

    it('shows the visit to its own doctor', async () => {
        const res = await request(app).get(`/api/appointments/${appointmentId}`).set(authHeader(doctor))

        expect(res.status).toBe(200)
    })

    it('hides the visit from an unrelated doctor', async () => {
        const other = createDoctor({ email: 'other-doc@test.com' })

        const res = await request(app).get(`/api/appointments/${appointmentId}`).set(authHeader(other))

        expect(res.status).toBe(403)
    })

    it('shows any visit to an admin', async () => {
        const admin = createAdmin()

        const res = await request(app).get(`/api/appointments/${appointmentId}`).set(authHeader(admin))

        expect(res.status).toBe(200)
    })

    it('lets any doctor query any patient list, filtered to their own visits', async () => {
        const other = createDoctor({ email: 'other-doc@test.com' })

        const mine   = await request(app)
            .get(`/api/appointments/patient/${patient.patient_id}`).set(authHeader(doctor))
        const theirs = await request(app)
            .get(`/api/appointments/patient/${patient.patient_id}`).set(authHeader(other))

        expect(mine.status).toBe(200)
        expect(mine.body).toHaveLength(1)

        // Not 403 — the route answers, but only with what belongs to the caller.
        expect(theirs.status).toBe(200)
        expect(theirs.body).toHaveLength(0)
    })
})

describe('doctor profile ownership', () => {
    it('lets a doctor edit their own profile', async () => {
        const doctor = createDoctor()

        const res = await request(app)
            .put(`/api/doctors/${doctor.doctor_id}`)
            .set(authHeader(doctor))
            .send({ bio: 'Updated bio' })

        expect(res.status).toBe(200)
    })

    it('stops a doctor from editing another doctor profile', async () => {
        const doctor = createDoctor()
        const other  = createDoctor({ email: 'other-doc@test.com' })

        const res = await request(app)
            .put(`/api/doctors/${other.doctor_id}`)
            .set(authHeader(doctor))
            .send({ bio: 'Hijacked' })

        expect(res.status).toBe(403)
    })

    it('stops a patient from editing any doctor profile', async () => {
        const doctor  = createDoctor()
        const patient = createPatient()

        const res = await request(app)
            .put(`/api/doctors/${doctor.doctor_id}`)
            .set(authHeader(patient))
            .send({ bio: 'Hijacked' })

        expect(res.status).toBe(403)
    })

    it('lets an admin edit any doctor profile', async () => {
        const doctor = createDoctor()
        const admin  = createAdmin()

        const res = await request(app)
            .put(`/api/doctors/${doctor.doctor_id}`)
            .set(authHeader(admin))
            .send({ bio: 'Edited by admin' })

        expect(res.status).toBe(200)
    })
})
