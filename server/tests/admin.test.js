import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'

import createApp from '../app.js'
import { db, resetDb } from './helpers/db.js'
import {
    createPatient, createDoctor, createAdmin, createAppointment,
    createSpecialization, createLanguage, authHeader,
} from './helpers/fixtures.js'

const app = createApp()

let admin

beforeEach(() => {
    resetDb()
    admin = createAdmin()
})

const asAdmin = () => authHeader(admin)

describe('GET /api/admin/stats', () => {
    it('counts doctors, patients, appointments and revenue', async () => {
        const doctor  = createDoctor({ price: 200 })
        const patient = createPatient()
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id, time: '10:00', status: 'Completed' })
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id, time: '11:00', status: 'Cancelled' })

        const res = await request(app).get('/api/admin/stats').set(asAdmin())

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({
            totalAppointments: 2,
            activeDoctors:     1,
            totalPatients:     1,
        })
        expect(typeof res.body.totalRevenue).toBe('number')
    })

    it('does not count a soft-deleted doctor as active', async () => {
        const doctor = createDoctor()
        db.prepare(`UPDATE users SET deleted_at = datetime('now') WHERE id = ?`).run(doctor.id)

        const res = await request(app).get('/api/admin/stats').set(asAdmin())

        expect(res.body.activeDoctors).toBe(0)
    })

    it('returns zeroes on an empty database', async () => {
        const res = await request(app).get('/api/admin/stats').set(asAdmin())

        expect(res.body).toMatchObject({
            totalAppointments: 0,
            activeDoctors:     0,
            totalRevenue:      0,
        })
    })
})

describe('GET /api/admin/recent-activity', () => {
    it('returns a list', async () => {
        const doctor  = createDoctor()
        const patient = createPatient()
        createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id })

        const res = await request(app).get('/api/admin/recent-activity').set(asAdmin())

        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
    })

    it('returns an empty list when nothing happened', async () => {
        const res = await request(app).get('/api/admin/recent-activity').set(asAdmin())

        expect(res.body).toEqual([])
    })
})

describe('GET /api/admin/:table', () => {
    beforeEach(() => {
        createDoctor({ email: 'a@test.com', fullName: 'Anna Adams' })
        createDoctor({ email: 'b@test.com', fullName: 'Boris Baker' })
        createPatient({ email: 'p1@test.com', fullName: 'Petra Pine' })
    })

    it('lists doctors in an envelope', async () => {
        const res = await request(app).get('/api/admin/doctors').set(asAdmin())

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({ totalCount: 2, page: 1, totalPages: 1 })
        expect(res.body.data).toHaveLength(2)
    })

    it('lists patients without counting doctors or admins', async () => {
        const res = await request(app).get('/api/admin/patients').set(asAdmin())

        expect(res.body.totalCount).toBe(1)
        expect(res.body.data[0].full_name).toBe('Petra Pine')
    })

    it('lists appointments', async () => {
        const doctor  = db.prepare('SELECT id FROM doctors LIMIT 1').get()
        const patient = db.prepare(`SELECT id FROM patients WHERE full_name = 'Petra Pine'`).get()
        createAppointment({ doctorId: doctor.id, patientId: patient.id })

        const res = await request(app).get('/api/admin/appointments').set(asAdmin())

        expect(res.body.totalCount).toBe(1)
    })

    it('paginates', async () => {
        const res = await request(app).get('/api/admin/doctors').query({ limit: 1, page: 2 }).set(asAdmin())

        expect(res.body.data).toHaveLength(1)
        expect(res.body.totalPages).toBe(2)
        expect(res.body.page).toBe(2)
    })

    it('searches by name', async () => {
        const res = await request(app).get('/api/admin/doctors').query({ search: 'Boris' }).set(asAdmin())

        expect(res.body.totalCount).toBe(1)
    })

    it('returns an empty page when the search matches nothing', async () => {
        const res = await request(app).get('/api/admin/doctors').query({ search: 'Nobody' }).set(asAdmin())

        expect(res.body.totalCount).toBe(0)
        expect(res.body.data).toEqual([])
    })

    it('rejects a page size above the cap', async () => {
        const res = await request(app).get('/api/admin/doctors').query({ limit: 999 }).set(asAdmin())

        expect(res.status).toBe(400)
    })

    it('rejects page zero', async () => {
        const res = await request(app).get('/api/admin/doctors').query({ page: 0 }).set(asAdmin())

        expect(res.status).toBe(400)
    })

    it('hides soft-deleted doctors', async () => {
        const doctor = db.prepare(`SELECT user_id FROM doctors LIMIT 1`).get()
        db.prepare(`UPDATE users SET deleted_at = datetime('now') WHERE id = ?`).run(doctor.user_id)

        const res = await request(app).get('/api/admin/doctors').set(asAdmin())

        expect(res.body.totalCount).toBe(1)
    })
})

describe('GET /api/admin/:table/:id', () => {
    it('returns one doctor record', async () => {
        const doctor = createDoctor()

        const res = await request(app).get(`/api/admin/doctors/${doctor.doctor_id}`).set(asAdmin())

        expect(res.status).toBe(200)
        expect(res.body.id).toBe(doctor.doctor_id)
    })

    it('returns one patient record', async () => {
        const patient = createPatient()

        const res = await request(app).get(`/api/admin/patients/${patient.patient_id}`).set(asAdmin())

        expect(res.status).toBe(200)
        expect(res.body.full_name).toBe(patient.fullName)
    })

    it('returns one appointment record', async () => {
        const doctor  = createDoctor()
        const patient = createPatient()
        const id      = createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id })

        const res = await request(app).get(`/api/admin/appointments/${id}`).set(asAdmin())

        expect(res.status).toBe(200)
        expect(res.body.id).toBe(id)
    })

    it('404s an unknown id', async () => {
        const res = await request(app).get('/api/admin/doctors/9999').set(asAdmin())

        expect(res.status).toBe(404)
    })

    it('400s a table outside the allow list', async () => {
        const res = await request(app).get('/api/admin/users/1').set(asAdmin())

        expect(res.status).toBe(400)
    })
})

describe('PUT /api/admin/doctors/:id', () => {
    let doctor

    beforeEach(() => {
        doctor = createDoctor({ price: 200 })
        createSpecialization('Neurology')
        createLanguage('English')
    })

    function put(body, id = doctor.doctor_id) {
        return request(app).put(`/api/admin/doctors/${id}`).set(asAdmin()).send(body)
    }

    it('updates doctor-table fields', async () => {
        const res = await put({ price: 350, bio: 'New bio', education: 'Med school' })

        expect(res.status).toBe(200)

        const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctor.doctor_id)
        expect(row).toMatchObject({ price: 350, bio: 'New bio', education: 'Med school' })
    })

    it('updates the working hours', async () => {
        const res = await put({ work_start: '09:00', work_end: '17:00' })

        expect(res.status).toBe(200)

        const row = db.prepare('SELECT work_start, work_end FROM doctors WHERE id = ?').get(doctor.doctor_id)
        expect(row).toMatchObject({ work_start: '09:00', work_end: '17:00' })
    })

    it('rejects a shift that ends before it starts', async () => {
        const res = await put({ work_start: '18:00', work_end: '09:00' })

        expect(res.status).toBe(400)
    })

    it('moves the doctor to another specialization', async () => {
        const res = await put({ specialization: 'Neurology' })

        expect(res.status).toBe(200)

        const row = db.prepare(`
            SELECT s.name FROM doctors d JOIN specializations s ON s.id = d.specialization_id
            WHERE d.id = ?
        `).get(doctor.doctor_id)
        expect(row.name).toBe('Neurology')
    })

    it('rejects a specialization that is not in the table', async () => {
        const res = await put({ specialization: 'Pediatrics' })

        expect(res.status).toBe(400)

        const row = db.prepare('SELECT specialization_id FROM doctors WHERE id = ?').get(doctor.doctor_id)
        expect(row.specialization_id).not.toBeNull()
    })

    it('rejects a specialization outside the allowed enum', async () => {
        const res = await put({ specialization: 'Astrology' })

        expect(res.status).toBe(400)
    })

    it('updates the name, which lives on the patients row', async () => {
        const res = await put({ full_name: 'Renamed Doctor' })

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT full_name FROM patients WHERE user_id = ?').get(doctor.id).full_name)
            .toBe('Renamed Doctor')
    })

    it('updates the email, which lives on the users row', async () => {
        const res = await put({ email: 'renamed@test.com' })

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT email FROM users WHERE id = ?').get(doctor.id).email)
            .toBe('renamed@test.com')
    })

    it('rejects an email already taken by someone else', async () => {
        createPatient({ email: 'taken@test.com' })

        const res = await put({ email: 'taken@test.com' })

        expect(res.status).toBe(400)
    })

    it('rejects a malformed email', async () => {
        const res = await put({ email: 'not-an-email' })

        expect(res.status).toBe(400)
    })

    it('replaces the spoken languages', async () => {
        createLanguage('Polish')

        const res = await put({ languages: 'English,Polish' })

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT COUNT(*) AS n FROM doctor_languages WHERE doctor_id = ?')
            .get(doctor.doctor_id).n).toBe(2)
    })

    it('adds a language that is not in the table yet', async () => {
        const res = await put({ languages: 'Ukrainian' })

        expect(res.status).toBe(200)
        expect(db.prepare(`SELECT name FROM languages WHERE name = 'Ukrainian'`).get()).toBeTruthy()
    })

    it('rejects an empty body', async () => {
        const res = await put({})

        expect(res.status).toBe(400)
    })

    it('404s an unknown doctor', async () => {
        const res = await put({ price: 100 }, 9999)

        expect(res.status).toBe(404)
    })
})

describe('PUT /api/admin/patients/:id', () => {
    let patient

    beforeEach(() => {
        patient = createPatient()
    })

    function put(body, id = patient.patient_id) {
        return request(app).put(`/api/admin/patients/${id}`).set(asAdmin()).send(body)
    }

    it('updates the name and phone', async () => {
        const res = await put({ full_name: 'Renamed Patient', phone: '+48123456789' })

        expect(res.status).toBe(200)

        const row = db.prepare('SELECT full_name, phone FROM patients WHERE id = ?').get(patient.patient_id)
        expect(row).toMatchObject({ full_name: 'Renamed Patient', phone: '+48123456789' })
    })

    it('updates the email on the users row', async () => {
        const res = await put({ email: 'renamed@test.com' })

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT email FROM users WHERE id = ?').get(patient.id).email)
            .toBe('renamed@test.com')
    })

    it('rejects an email already taken by someone else', async () => {
        createPatient({ email: 'taken@test.com' })

        const res = await put({ email: 'taken@test.com' })

        expect(res.status).toBe(400)
    })

    it('rejects a name that is too short', async () => {
        const res = await put({ full_name: 'X' })

        expect(res.status).toBe(400)
    })

    it('rejects an empty body', async () => {
        const res = await put({})

        expect(res.status).toBe(400)
    })

    it('404s an unknown patient', async () => {
        const res = await put({ full_name: 'Ghost Patient' }, 9999)

        expect(res.status).toBe(404)
    })
})

describe('PUT /api/admin/appointments/:id', () => {
    let doctor, patient, appointmentId

    beforeEach(() => {
        doctor        = createDoctor({ workStart: '08:00', workEnd: '12:00' })
        patient       = createPatient()
        appointmentId = createAppointment({
            doctorId: doctor.doctor_id, patientId: patient.patient_id, date: '2030-01-01', time: '10:00',
        })
    })

    function put(body, id = appointmentId) {
        return request(app).put(`/api/admin/appointments/${id}`).set(asAdmin()).send(body)
    }

    it('reschedules date and time', async () => {
        const res = await put({ appointment_date: '2030-02-02', appointment_time: '09:00' })

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT scheduled_at FROM appointments WHERE id = ?').get(appointmentId).scheduled_at)
            .toBe('2030-02-02 09:00:00')
    })

    it('changes the status', async () => {
        const res = await put({ status: 'Completed' })

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT status FROM appointments WHERE id = ?').get(appointmentId).status)
            .toBe('Completed')
    })

    it('edits symptoms and notes', async () => {
        const res = await put({ symptoms: 'Cough', doctor_notes: 'Rest' })

        expect(res.status).toBe(200)

        const row = db.prepare('SELECT symptoms, doctor_notes FROM appointments WHERE id = ?').get(appointmentId)
        expect(row).toMatchObject({ symptoms: 'Cough', doctor_notes: 'Rest' })
    })

    it('refuses to move a visit onto a slot the same doctor already has', async () => {
        createAppointment({
            doctorId: doctor.doctor_id, patientId: patient.patient_id, date: '2030-01-01', time: '11:00',
        })

        const res = await put({ appointment_time: '11:00' })

        expect(res.status).toBe(409)
    })

    it('rejects an invalid status', async () => {
        const res = await put({ status: 'Rescheduled' })

        expect(res.status).toBe(400)
    })

    it('rejects a malformed time', async () => {
        const res = await put({ appointment_time: '25:99' })

        expect(res.status).toBe(400)
    })

    it('rejects an empty body', async () => {
        const res = await put({})

        expect(res.status).toBe(400)
    })

    it('404s an unknown appointment', async () => {
        const res = await put({ status: 'Cancelled' }, 9999)

        expect(res.status).toBe(404)
    })
})

describe('DELETE /api/admin/doctors/:id', () => {
    it('soft-deletes the user and hides the doctor from the public catalogue', async () => {
        const doctor = createDoctor()

        const res = await request(app).delete(`/api/admin/doctors/${doctor.doctor_id}`).set(asAdmin())

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT deleted_at FROM users WHERE id = ?').get(doctor.id).deleted_at).not.toBeNull()

        const list = await request(app).get('/api/doctors')
        expect(list.body.totalCount).toBe(0)
    })

    it('cancels the scheduled visits of that doctor', async () => {
        const doctor  = createDoctor()
        const patient = createPatient()
        const id      = createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id })

        await request(app).delete(`/api/admin/doctors/${doctor.doctor_id}`).set(asAdmin())

        expect(db.prepare('SELECT status FROM appointments WHERE id = ?').get(id).status).toBe('Cancelled')
    })

    it('revokes the refresh tokens of that doctor', async () => {
        const doctor = createDoctor()
        await request(app).post('/api/login').send({ email: doctor.email, password: doctor.password })

        await request(app).delete(`/api/admin/doctors/${doctor.doctor_id}`).set(asAdmin())

        const active = db.prepare('SELECT COUNT(*) AS n FROM refresh_tokens WHERE user_id = ? AND revoked = 0')
            .get(doctor.id).n
        expect(active).toBe(0)
    })

    it('404s an unknown doctor', async () => {
        const res = await request(app).delete('/api/admin/doctors/9999').set(asAdmin())

        expect(res.status).toBe(404)
    })
})

describe('DELETE /api/admin/patients/:id', () => {
    it('soft-deletes the user and blocks the login', async () => {
        const patient = createPatient()

        const res = await request(app).delete(`/api/admin/patients/${patient.patient_id}`).set(asAdmin())

        expect(res.status).toBe(200)

        const login = await request(app).post('/api/login')
            .send({ email: patient.email, password: patient.password })
        expect(login.status).toBe(401)
    })

    it('cancels the scheduled visits of that patient', async () => {
        const doctor  = createDoctor()
        const patient = createPatient()
        const id      = createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id })

        await request(app).delete(`/api/admin/patients/${patient.patient_id}`).set(asAdmin())

        expect(db.prepare('SELECT status FROM appointments WHERE id = ?').get(id).status).toBe('Cancelled')
    })

    it('404s an unknown patient', async () => {
        const res = await request(app).delete('/api/admin/patients/9999').set(asAdmin())

        expect(res.status).toBe(404)
    })
})

describe('DELETE /api/admin/appointments/:id', () => {
    it('removes the row', async () => {
        const doctor  = createDoctor()
        const patient = createPatient()
        const id      = createAppointment({ doctorId: doctor.doctor_id, patientId: patient.patient_id })

        const res = await request(app).delete(`/api/admin/appointments/${id}`).set(asAdmin())

        expect(res.status).toBe(200)
        expect(db.prepare('SELECT COUNT(*) AS n FROM appointments').get().n).toBe(0)
    })

    it('404s an unknown appointment', async () => {
        const res = await request(app).delete('/api/admin/appointments/9999').set(asAdmin())

        expect(res.status).toBe(404)
    })

    it('400s a table outside the allow list', async () => {
        const res = await request(app).delete('/api/admin/users/1').set(asAdmin())

        expect(res.status).toBe(400)
    })
})

describe('GET /api/stats/public', () => {
    it('is public and reports the catalogue size', async () => {
        createDoctor({ email: 'a@test.com', specialization: 'Cardiology' })
        createDoctor({ email: 'b@test.com', specialization: 'Neurology' })
        createPatient()

        const res = await request(app).get('/api/stats/public')

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({
            doctorsCount:         2,
            specializationsCount: 2,
        })
    })

    it('does not count soft-deleted doctors', async () => {
        const doctor = createDoctor()
        db.prepare(`UPDATE users SET deleted_at = datetime('now') WHERE id = ?`).run(doctor.id)

        const res = await request(app).get('/api/stats/public')

        expect(res.body.doctorsCount).toBe(0)
    })
})
