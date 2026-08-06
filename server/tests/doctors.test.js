import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'

import createApp from '../app.js'
import { db, resetDb } from './helpers/db.js'
import {
    createPatient, createDoctor, createAdmin, createAppointment,
    createSpecialization, authHeader,
} from './helpers/fixtures.js'

const app = createApp()

beforeEach(() => {
    resetDb()
})

describe('GET /api/doctors', () => {
    beforeEach(() => {
        createDoctor({ email: 'a@test.com', fullName: 'Anna Adams',  specialization: 'Cardiology', gender: 'Female', price: 100 })
        createDoctor({ email: 'b@test.com', fullName: 'Boris Baker', specialization: 'Neurology',  gender: 'Male',   price: 300 })
        createDoctor({ email: 'c@test.com', fullName: 'Clara Cole',  specialization: 'Cardiology', gender: 'Female', price: 500 })
    })

    it('is public and returns a paginated envelope', async () => {
        const res = await request(app).get('/api/doctors')

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({ totalCount: 3, page: 1, totalPages: 1 })
        expect(res.body.doctors).toHaveLength(3)
    })

    it('paginates', async () => {
        const res = await request(app).get('/api/doctors').query({ limit: 2, page: 2 })

        expect(res.body.doctors).toHaveLength(1)
        expect(res.body.totalPages).toBe(2)
    })

    it('filters by specialization', async () => {
        const res = await request(app).get('/api/doctors').query({ specialization: 'Cardiology' })

        expect(res.body.totalCount).toBe(2)
    })

    it('filters by gender', async () => {
        const res = await request(app).get('/api/doctors').query({ gender: 'Male' })

        expect(res.body.totalCount).toBe(1)
    })

    it('filters by price range', async () => {
        const res = await request(app).get('/api/doctors').query({ minPrice: 200, maxPrice: 400 })

        expect(res.body.totalCount).toBe(1)
        expect(res.body.doctors[0].price).toBe(300)
    })

    it('searches by name', async () => {
        const res = await request(app).get('/api/doctors').query({ name: 'bor' })

        expect(res.body.totalCount).toBe(1)
    })

    it('sorts by price', async () => {
        const res = await request(app).get('/api/doctors').query({ sort: 'price_desc' })

        expect(res.body.doctors.map(d => d.price)).toEqual([500, 300, 100])
    })

    it('rejects an unknown sort key', async () => {
        const res = await request(app).get('/api/doctors').query({ sort: 'price_sideways' })

        expect(res.status).toBe(400)
    })

    it('caps the page size', async () => {
        const res = await request(app).get('/api/doctors').query({ limit: 500 })

        expect(res.status).toBe(400)
    })

    it('computes experience from the career start date', async () => {
        const res = await request(app).get('/api/doctors').query({ name: 'Anna' })

        expect(res.body.doctors[0].experience).toMatchObject({
            years:  expect.any(Number),
            months: expect.any(Number),
        })
    })

    it('reports the price range across the catalogue', async () => {
        const res = await request(app).get('/api/doctors/price-range')

        expect(res.body).toEqual({ min: 100, max: 500 })
    })
})

describe('GET /api/doctors/:id', () => {
    it('returns one doctor', async () => {
        const doctor = createDoctor()

        const res = await request(app).get(`/api/doctors/${doctor.doctor_id}`)

        expect(res.status).toBe(200)
        expect(res.body.id).toBe(doctor.doctor_id)
    })

    it('404s an unknown doctor', async () => {
        const res = await request(app).get('/api/doctors/9999')

        expect(res.status).toBe(404)
    })
})

describe('GET /api/doctors/:id/slots', () => {
    let doctor, patient

    beforeEach(() => {
        doctor  = createDoctor({ workStart: '08:00', workEnd: '10:00' })
        patient = createPatient()
    })

    function slots(user, date = '2030-01-01') {
        return request(app).get(`/api/doctors/${doctor.doctor_id}/slots`).query({ date }).set(authHeader(user))
    }

    it('requires a token', async () => {
        const res = await request(app).get(`/api/doctors/${doctor.doctor_id}/slots`).query({ date: '2030-01-01' })

        expect(res.status).toBe(401)
    })

    it('requires a date', async () => {
        const res = await request(app).get(`/api/doctors/${doctor.doctor_id}/slots`).set(authHeader(patient))

        expect(res.status).toBe(400)
    })

    it('builds a 30 minute grid bounded by the working hours', async () => {
        const res = await slots(patient)

        expect(res.body.slots.map(s => s.time)).toEqual(['08:00', '08:30', '09:00', '09:30'])
    })

    it('hides who booked a slot from another patient', async () => {
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id, date: '2030-01-01', time: '08:30' })

        const stranger = createPatient({ email: 'stranger@test.com' })
        const res      = await slots(stranger)

        const taken = res.body.slots.find(s => s.time === '08:30')
        expect(taken).toMatchObject({ status: 'Booked', patient_name: null, appointment_id: null })
    })

    it('shows the patient name to the doctor who owns the schedule', async () => {
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id, date: '2030-01-01', time: '08:30' })

        const res   = await slots(doctor)
        const taken = res.body.slots.find(s => s.time === '08:30')

        expect(taken).toMatchObject({ status: 'Scheduled', patient_name: patient.fullName })
        expect(taken.appointment_id).toBeTruthy()
    })

    it('shows the patient name to an admin', async () => {
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id, date: '2030-01-01', time: '08:30' })

        const res   = await slots(createAdmin())
        const taken = res.body.slots.find(s => s.time === '08:30')

        expect(taken.patient_name).toBe(patient.fullName)
    })

    it('frees a slot again once its appointment is cancelled', async () => {
        createAppointment({
            doctorId: doctor.doctor_id, patientId: patient.patient_id,
            date: '2030-01-01', time: '08:30', status: 'Cancelled',
        })

        const res = await slots(patient)

        expect(res.body.slots.find(s => s.time === '08:30').status).toBe('Free')
    })

    it('404s an unknown doctor', async () => {
        const res = await request(app)
            .get('/api/doctors/9999/slots').query({ date: '2030-01-01' }).set(authHeader(patient))

        expect(res.status).toBe(404)
    })
})

describe('POST /api/doctors', () => {
    const payload = {
        email:             'newdoc@test.com',
        password:          'doctor123',
        full_name:         'New Doctor',
        specialization:    'Surgery',
        career_start_date: '2018-05-01',
        price:             250,
    }

    it('lets an admin create a doctor across three tables', async () => {
        const admin = createAdmin()
        createSpecialization('Surgery')

        const res = await request(app).post('/api/doctors').set(authHeader(admin)).send(payload)

        expect(res.status).toBe(201)

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(payload.email)
        expect(user.role).toBe('doctor')

        expect(db.prepare('SELECT full_name FROM patients WHERE user_id = ?').get(user.id).full_name)
            .toBe('New Doctor')
        expect(db.prepare('SELECT price FROM doctors WHERE user_id = ?').get(user.id).price)
            .toBe(250)
    })

    it('is closed to non-admins', async () => {
        const doctor = createDoctor()

        const res = await request(app).post('/api/doctors').set(authHeader(doctor)).send(payload)

        expect(res.status).toBe(403)
    })

    it('rejects a duplicate email without leaving a partial record', async () => {
        const admin = createAdmin()
        createPatient({ email: payload.email })

        const res = await request(app).post('/api/doctors').set(authHeader(admin)).send(payload)

        expect(res.status).toBe(400)
        expect(db.prepare('SELECT COUNT(*) AS n FROM doctors').get().n).toBe(0)
    })

    it('rejects an unknown specialization', async () => {
        const admin = createAdmin()

        const res = await request(app)
            .post('/api/doctors').set(authHeader(admin))
            .send({ ...payload, specialization: 'Astrology' })

        expect(res.status).toBe(400)
    })

    it('rejects a specialization missing from the table instead of crashing', async () => {
        const admin = createAdmin()

        const res = await request(app).post('/api/doctors').set(authHeader(admin)).send(payload)

        expect(res.status).toBe(400)
    })
})
