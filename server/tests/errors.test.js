import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createRequire } from 'node:module'

import createApp from '../app.js'
import { resetDb } from './helpers/db.js'
import { createPatient, createDoctor, createAdmin, createAppointment, authHeader } from './helpers/fixtures.js'

const require = createRequire(import.meta.url)
const { MESSAGES } = require('../errors.js')
const catalogs = {
    en: require('../../client/src/i18n/en.json'),
    pl: require('../../client/src/i18n/pl.json'),
}

const app = createApp()

let patient, doctor, admin

beforeEach(() => {
    resetDb()
    patient = createPatient()
    doctor  = createDoctor({ workStart: '08:00', workEnd: '12:00' })
    admin   = createAdmin()
})

const booking = (overrides = {}) => ({
    doctor_id: doctor.doctor_id, appointment_date: '2030-01-01', appointment_time: '10:00', ...overrides,
})

// Every 4xx answer must carry a catalog code, so the client can translate it.
const cases = [
    ['invalid email',           () => request(app).post('/api/register').send({ email: 'x', password: 'testtest', full_name: 'Ann Lee' }), 'validation.email'],
    ['short password',          () => request(app).post('/api/register').send({ email: 'a@b.co', password: 'ab', full_name: 'Ann Lee' }), 'validation.passwordMin', { count: 4 }],
    ['short name',              () => request(app).post('/api/register').send({ email: 'a@b.co', password: 'testtest', full_name: 'A' }), 'validation.nameMin', { count: 2 }],
    ['missing field',           () => request(app).post('/api/appointments').set(authHeader(patient)).send({ appointment_date: '2030-01-01', appointment_time: '10:00' }), 'validation.invalid', { field: 'doctor_id' }],
    ['bad date format',         () => request(app).post('/api/appointments').set(authHeader(patient)).send(booking({ appointment_date: '01-01-2030' })), 'validation.dateFormat'],
    ['impossible date',         () => request(app).post('/api/appointments').set(authHeader(patient)).send(booking({ appointment_date: '2030-02-31' })), 'validation.dateInvalid'],
    ['bad time format',         () => request(app).post('/api/appointments').set(authHeader(patient)).send(booking({ appointment_time: '25:00' })), 'validation.timeFormat'],
    ['symptoms too long',       () => request(app).post('/api/appointments').set(authHeader(patient)).send(booking({ symptoms: 'x'.repeat(251) })), 'validation.symptomsMax', { count: 250 }],
    ['bio too long',            () => request(app).put(`/api/doctors/${doctor.doctor_id}`).set(authHeader(doctor)).send({ bio: 'x'.repeat(1001) }), 'validation.bioMax', { count: 1000 }],
    ['negative price',          () => request(app).put(`/api/admin/doctors/${doctor.doctor_id}`).set(authHeader(admin)).send({ price: -5 }), 'validation.priceNegative'],
    ['empty admin update',      () => request(app).put(`/api/admin/patients/${patient.patient_id}`).set(authHeader(admin)).send({}), 'errors.NO_EDITABLE_FIELDS'],
    ['outside working hours',   () => request(app).post('/api/appointments').set(authHeader(patient)).send(booking({ appointment_time: '13:00' })), 'errors.OUTSIDE_WORKING_HOURS'],
    ['off the slot grid',       () => request(app).post('/api/appointments').set(authHeader(patient)).send(booking({ appointment_time: '10:15' })), 'errors.SLOT_STEP', { minutes: 30 }],
    ['past date',               () => request(app).post('/api/appointments').set(authHeader(patient)).send(booking({ appointment_date: '2020-01-01' })), 'errors.PAST_DATE'],
    ['doctor booking',          () => request(app).post('/api/appointments').set(authHeader(doctor)).send(booking()), 'errors.PATIENTS_ONLY'],
    ['unknown doctor booking',  () => request(app).post('/api/appointments').set(authHeader(patient)).send(booking({ doctor_id: 9999 })), 'errors.DOCTOR_NOT_FOUND'],
    ['unknown appointment',     () => request(app).get('/api/appointments/9999').set(authHeader(patient)), 'errors.APPOINTMENT_NOT_FOUND'],
    ['unknown doctor',          () => request(app).get('/api/doctors/9999'), 'errors.DOCTOR_NOT_FOUND'],
    ['slots without date',      () => request(app).get(`/api/doctors/${doctor.doctor_id}/slots`).set(authHeader(patient)), 'errors.DATE_REQUIRED'],
    ['foreign doctor profile',  () => request(app).put(`/api/doctors/${doctor.doctor_id}`).set(authHeader(patient)).send({ bio: 'x' }), 'errors.FORBIDDEN'],
    ['taken email on create',   () => request(app).post('/api/doctors').set(authHeader(admin)).send({ email: patient.email, password: 'testtest', full_name: 'Doc Two', specialization: 'Cardiology', career_start_date: '2015-01-01' }), 'errors.EMAIL_EXISTS'],
    ['unknown specialization',  () => request(app).post('/api/doctors').set(authHeader(admin)).send({ email: 'new@doc.co', password: 'testtest', full_name: 'Doc Two', specialization: 'Surgery', career_start_date: '2015-01-01' }), 'errors.UNKNOWN_SPECIALIZATION'],
    ['admin table not allowed', () => request(app).get('/api/admin/users').set(authHeader(admin)), 'errors.INVALID_TABLE'],
    ['admin record missing',    () => request(app).get('/api/admin/doctors/9999').set(authHeader(admin)), 'errors.NOT_FOUND'],
    ['admin taken email',       () => request(app).put(`/api/admin/doctors/${doctor.doctor_id}`).set(authHeader(admin)).send({ email: patient.email }), 'errors.EMAIL_EXISTS'],
]

describe('error responses', () => {
    it.each(cases.map(([name, send, code, params]) => ({ name, send, code, params })))('$name → $code', async ({ send, code, params }) => {
        const res = await send()

        expect(res.status).toBeGreaterThanOrEqual(400)
        expect(res.status).toBeLessThan(500)
        expect(res.body.code).toBe(code)
        expect(res.body.error).toBe(MESSAGES[code].replace(/\{\{(\w+)}}/g, (_, k) => String(params?.[k])))
        if (params) expect(res.body.params).toEqual(params)
    })

    it('answers a patient editing a visit with nothing they may change', async () => {
        const id = createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id })

        const res = await request(app)
            .patch(`/api/appointments/${id}`).set(authHeader(patient)).send({ doctor_notes: 'x' })

        expect(res.body.code).toBe('errors.NO_EDITABLE_FIELDS')
    })

    it('answers a patient trying to complete a visit', async () => {
        const id = createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id })

        const res = await request(app)
            .patch(`/api/appointments/${id}`).set(authHeader(patient)).send({ status: 'Completed' })

        expect(res.body.code).toBe('errors.STATUS_CHANGE_FORBIDDEN')
    })
})

describe('client translations', () => {
    const translated = (catalog, code) => {
        const [ns, key] = code.split('.')
        const section = catalog[ns] ?? {}
        return key in section || `${key}_one` in section
    }

    it.each(Object.keys(catalogs))('%s has a message for every server code', (lang) => {
        const missing = Object.keys(MESSAGES).filter(code => !translated(catalogs[lang], code))

        expect(missing).toEqual([])
    })
})
