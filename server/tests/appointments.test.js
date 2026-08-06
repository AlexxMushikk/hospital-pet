import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'

import createApp from '../app.js'
import { db, resetDb } from './helpers/db.js'
import { createPatient, createDoctor, createAdmin, createAppointment, authHeader } from './helpers/fixtures.js'

const app = createApp()

const FUTURE = '2030-01-01'

let doctor
let patient

beforeEach(() => {
    resetDb()
    doctor  = createDoctor({ workStart: '08:00', workEnd: '12:00' })
    patient = createPatient()
})

function book(user, body) {
    return request(app).post('/api/appointments').set(authHeader(user)).send(body)
}

describe('POST /api/appointments', () => {
    it('books a free slot and attributes it to the caller', async () => {
        const res = await book(patient, {
            doctor_id:        doctor.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '10:00',
            symptoms:         'Headache',
        })

        expect(res.status).toBe(201)

        const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(res.body.id)
        expect(row).toMatchObject({
            doctor_id:    doctor.doctor_id,
            patient_id:   patient.patient_id,
            scheduled_at: `${FUTURE} 10:00:00`,
            status:       'Scheduled',
            symptoms:     'Headache',
        })
    })

    it('ignores a patient_id supplied by the client', async () => {
        const other = createPatient({ email: 'other@test.com' })

        const res = await book(patient, {
            doctor_id:        doctor.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '10:00',
            patient_id:       other.patient_id,
        })

        const row = db.prepare('SELECT patient_id FROM appointments WHERE id = ?').get(res.body.id)
        expect(row.patient_id).toBe(patient.patient_id)
    })

    it('rejects a slot already taken by someone else', async () => {
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id, date: FUTURE, time: '10:00' })

        const res = await book(patient, {
            doctor_id:        doctor.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '10:00',
        })

        expect(res.status).toBe(409)
    })

    it('frees the slot again once an appointment is cancelled', async () => {
        createAppointment({
            doctorId: doctor.doctor_id, patientId: patient.patient_id,
            date: FUTURE, time: '10:00', status: 'Cancelled',
        })

        const res = await book(patient, {
            doctor_id:        doctor.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '10:00',
        })

        expect(res.status).toBe(201)
    })

    it('allows the same slot for two different doctors', async () => {
        const other = createDoctor({ email: 'other-doc@test.com' })

        const first  = await book(patient, { doctor_id: doctor.doctor_id, appointment_date: FUTURE, appointment_time: '10:00' })
        const second = await book(patient, { doctor_id: other.doctor_id,  appointment_date: FUTURE, appointment_time: '10:00' })

        expect(first.status).toBe(201)
        expect(second.status).toBe(201)
    })

    it('rejects malformed dates and times', async () => {
        const badDate = await book(patient, { doctor_id: doctor.doctor_id, appointment_date: '01-01-2030', appointment_time: '10:00' })
        const badTime = await book(patient, { doctor_id: doctor.doctor_id, appointment_date: FUTURE, appointment_time: '10' })

        expect(badDate.status).toBe(400)
        expect(badTime.status).toBe(400)
    })

    it('rejects symptoms longer than the column allows', async () => {
        const res = await book(patient, {
            doctor_id:        doctor.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '10:00',
            symptoms:         'x'.repeat(251),
        })

        expect(res.status).toBe(400)
    })
})

describe('POST /api/appointments — known gaps, failing until step 5', () => {
    it('rejects a date in the past', async () => {
        const res = await book(patient, {
            doctor_id:        doctor.doctor_id,
            appointment_date: '2020-01-01',
            appointment_time: '10:00',
        })

        expect(res.status).toBe(400)
    })

    it('rejects a time outside the doctor working hours', async () => {
        const res = await book(patient, {
            doctor_id:        doctor.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '23:30',
        })

        expect(res.status).toBe(400)
    })

    it('rejects a time that is not on the 30 minute grid', async () => {
        const res = await book(patient, {
            doctor_id:        doctor.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '10:17',
        })

        expect(res.status).toBe(400)
    })

    it('stops a doctor from booking as if they were a patient', async () => {
        const other = createDoctor({ email: 'other-doc@test.com' })

        const res = await book(doctor, {
            doctor_id:        other.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '10:00',
        })

        expect(res.status).toBe(403)
        expect(db.prepare('SELECT COUNT(*) AS n FROM appointments').get().n).toBe(0)
    })

    it('stops an admin from booking as if they were a patient', async () => {
        const admin = createAdmin()

        const res = await book(admin, {
            doctor_id:        doctor.doctor_id,
            appointment_date: FUTURE,
            appointment_time: '10:00',
        })

        expect(res.status).toBe(403)
    })

    it('404s an unknown doctor instead of failing on the foreign key', async () => {
        const res = await book(patient, {
            doctor_id:        9999,
            appointment_date: FUTURE,
            appointment_time: '10:00',
        })

        expect(res.status).toBe(404)
    })
})

describe('PATCH /api/appointments/:id', () => {
    let appointmentId

    beforeEach(() => {
        appointmentId = createAppointment({
            doctorId: doctor.doctor_id, patientId: patient.patient_id, date: FUTURE, time: '10:00',
        })
    })

    function patch(user, body) {
        return request(app).patch(`/api/appointments/${appointmentId}`).set(authHeader(user)).send(body)
    }

    it('lets the patient edit symptoms', async () => {
        const res = await patch(patient, { symptoms: 'Now with fever' })

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT symptoms FROM appointments WHERE id = ?').get(appointmentId).symptoms)
            .toBe('Now with fever')
    })

    it('lets the patient cancel', async () => {
        const res = await patch(patient, { status: 'Cancelled' })

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT status FROM appointments WHERE id = ?').get(appointmentId).status)
            .toBe('Cancelled')
    })

    it('stops the patient from marking a visit completed', async () => {
        const res = await patch(patient, { status: 'Completed' })

        expect(res.status).toBe(403)
    })

    it('lets the doctor complete the visit and write notes', async () => {
        const res = await patch(doctor, { status: 'Completed', doctor_notes: 'Prescribed rest' })

        expect(res.status).toBe(200)

        const row = db.prepare('SELECT status, doctor_notes FROM appointments WHERE id = ?').get(appointmentId)
        expect(row).toMatchObject({ status: 'Completed', doctor_notes: 'Prescribed rest' })
    })

    it('rejects an update that only names fields the role may not touch', async () => {
        const res = await patch(doctor, { symptoms: 'Doctor rewriting the complaint' })

        expect(res.status).toBe(400)
        expect(db.prepare('SELECT symptoms FROM appointments WHERE id = ?').get(appointmentId).symptoms)
            .toBeNull()
    })

    it('rejects an empty body', async () => {
        const res = await patch(patient, {})

        expect(res.status).toBe(400)
    })

    it('404s for an appointment that does not exist', async () => {
        const res = await request(app)
            .patch('/api/appointments/9999')
            .set(authHeader(patient))
            .send({ status: 'Cancelled' })

        expect(res.status).toBe(404)
    })
})

describe('GET /api/appointments', () => {
    it('returns the visit with doctor and patient names joined in', async () => {
        const id = createAppointment({
            doctorId: doctor.doctor_id, patientId: patient.patient_id, date: FUTURE, time: '10:00',
        })

        const res = await request(app).get(`/api/appointments/${id}`).set(authHeader(patient))

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({
            id,
            appointment_date: FUTURE,
            appointment_time: '10:00',
            doctor_name:      doctor.fullName,
            patient_name:     patient.fullName,
            doctor_spec:      'Cardiology',
        })
    })

    it('lists a patient own visits, newest first', async () => {
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id, date: '2030-01-01', time: '10:00' })
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id, date: '2030-02-01', time: '10:00' })

        const res = await request(app)
            .get(`/api/appointments/patient/${patient.patient_id}`)
            .set(authHeader(patient))

        expect(res.status).toBe(200)
        expect(res.body.map(a => a.appointment_date)).toEqual(['2030-02-01', '2030-01-01'])
    })
})
