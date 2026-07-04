const { db } = require('../db/database')

const findByDoctor = (doctorId, date) =>
    db.prepare(`
        SELECT a.appointment_time, a.status, p.full_name as patient_name, a.id as appointment_id
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.status != 'Cancelled'
    `).all(doctorId, date)

const findByPatient = (patientId) =>
    db.prepare(`
        SELECT a.*, p_doc.full_name as doctor_name, d.specialization as doctor_spec
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN patients p_doc ON d.user_id = p_doc.user_id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC
    `).all(patientId)

const findById = (id) =>
    db.prepare(`
        SELECT a.*,
               p.full_name  as patient_name,
               pd.full_name as doctor_name,
               d.specialization as doctor_spec
        FROM appointments a
        JOIN patients p  ON a.patient_id = p.id
        JOIN doctors d   ON a.doctor_id = d.id
        JOIN patients pd ON d.user_id = pd.user_id
        WHERE a.id = ?
    `).get(id)

const findConflict = (doctorId, date, time, excludeId = null) =>
    db.prepare(`
        SELECT id FROM appointments
        WHERE doctor_id = ? AND appointment_date = ?
          AND appointment_time = ? AND status != 'Cancelled'
          AND (? IS NULL OR id != ?)
    `).get(doctorId, date, time, excludeId, excludeId)

const create = ({ doctor_id, patient_id, appointment_date, appointment_time, symptoms }) =>
    db.prepare(`
        INSERT INTO appointments
        (doctor_id, patient_id, appointment_date, appointment_time, symptoms, status)
        VALUES (?, ?, ?, ?, ?, 'Scheduled')
    `).run(doctor_id, patient_id, appointment_date, appointment_time, symptoms ?? null).lastInsertRowid

const update = (id, fields) => {
    const allowed = ['symptoms', 'status', 'doctor_notes', 'appointment_date', 'appointment_time']
    const keys    = Object.keys(fields).filter(k => allowed.includes(k))
    if (keys.length === 0) return

    const set    = keys.map(k => `${k} = ?`).join(', ')
    const values = keys.map(k => fields[k])
    db.prepare(`UPDATE appointments SET ${set} WHERE id = ?`).run(...values, id)
}

const remove = (id) =>
    db.prepare(`DELETE FROM appointments WHERE id = ?`).run(id)

// Для админ листов с пагинацией
const findAll = ({ limit, offset }) =>
    db.prepare(`
        SELECT a.id, a.appointment_date, a.appointment_time, a.status,
               p.full_name as patient_name, pd.full_name as doctor_name
        FROM appointments a
        JOIN patients p  ON a.patient_id = p.id
        JOIN doctors d   ON a.doctor_id = d.id
        JOIN patients pd ON d.user_id = pd.user_id
        LIMIT ? OFFSET ?
    `).all(limit, offset)

const count = () =>
    db.prepare(`SELECT COUNT(*) as total FROM appointments`).get().total

module.exports = { findByDoctor, findByPatient, findById, findConflict, create, update, remove, findAll, count }
