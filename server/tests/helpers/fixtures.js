import bcrypt from 'bcrypt'

import { db } from './db.js'
import jwtService from '../../services/jwtService.js'

const TEST_ROUNDS = 4

export function hashPassword(password) {
    return bcrypt.hashSync(password, TEST_ROUNDS)
}

function lookupId(table, name) {
    db.prepare(`INSERT OR IGNORE INTO ${table} (name) VALUES (?)`).run(name)
    return db.prepare(`SELECT id FROM ${table} WHERE name = ?`).get(name).id
}

export const createSpecialization = (name = 'Cardiology') => lookupId('specializations', name)
export const createLanguage       = (name = 'English')    => lookupId('languages', name)

export function createPatient({
                                  email    = 'patient@test.com',
                                  password = 'testtest',
                                  fullName = 'Test Patient',
                                  phone    = null,
                              } = {}) {
    const userId = db
        .prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, 'patient')`)
        .run(email, hashPassword(password)).lastInsertRowid

    const patientId = db
        .prepare(`INSERT INTO patients (user_id, full_name, phone) VALUES (?, ?, ?)`)
        .run(userId, fullName, phone).lastInsertRowid

    return { id: userId, patient_id: patientId, doctor_id: null, email, password, role: 'patient', fullName }
}

export function createDoctor({
                                 email          = 'doctor@test.com',
                                 password       = 'doctor123',
                                 fullName       = 'Test Doctor',
                                 specialization = 'Cardiology',
                                 workStart      = '08:00',
                                 workEnd        = '18:00',
                                 price          = 200,
                                 gender         = 'Not Specified',
                                 careerStart    = '2015-01-01',
                             } = {}) {
    const specializationId = createSpecialization(specialization)

    const userId = db
        .prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, 'doctor')`)
        .run(email, hashPassword(password)).lastInsertRowid

    const patientId = db
        .prepare(`INSERT INTO patients (user_id, full_name) VALUES (?, ?)`)
        .run(userId, fullName).lastInsertRowid

    const doctorId = db
        .prepare(`
            INSERT INTO doctors (user_id, specialization_id, career_start_date, price, gender, work_start, work_end)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .run(userId, specializationId, careerStart, price, gender, workStart, workEnd).lastInsertRowid

    return { id: userId, doctor_id: doctorId, patient_id: patientId, email, password, role: 'doctor', fullName }
}

export function createAdmin({
                                email    = 'admin@test.com',
                                password = 'admin123',
                                fullName = 'System Administrator',
                            } = {}) {
    const userId = db
        .prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')`)
        .run(email, hashPassword(password)).lastInsertRowid

    const patientId = db
        .prepare(`INSERT INTO patients (user_id, full_name) VALUES (?, ?)`)
        .run(userId, fullName).lastInsertRowid

    return { id: userId, patient_id: patientId, doctor_id: null, email, password, role: 'admin', fullName }
}

export function createAppointment({
                                      doctorId,
                                      patientId,
                                      date   = '2030-01-01',
                                      time   = '10:00',
                                      status = 'Scheduled',
                                      symptoms = null,
                                  }) {
    return db
        .prepare(`
            INSERT INTO appointments (doctor_id, patient_id, scheduled_at, status, symptoms)
            VALUES (?, ?, ?, ?, ?)
        `)
        .run(doctorId, patientId, `${date} ${time}:00`, status, symptoms).lastInsertRowid
}


export function authHeader(user) {
    const token = jwtService.createAccessToken({
        id:         user.id,
        email:      user.email,
        role:       user.role,
        patient_id: user.patient_id,
        doctor_id:  user.doctor_id,
    })
    return { Authorization: `Bearer ${token}` }
}
