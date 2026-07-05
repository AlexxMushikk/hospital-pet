const { db } = require('../db/database')

// Собирает scheduled_at 'YYYY-MM-DD HH:MM:SS' из даты и времени.
const combine = (date, time) => `${date} ${time}:00`

const findByDoctor = (doctorId, date) =>
    db.prepare(`
        SELECT strftime('%H:%M', a.scheduled_at) as appointment_time,
               a.status, p.full_name as patient_name, a.id as appointment_id
        FROM appointments a
                 JOIN patients p ON a.patient_id = p.id
        WHERE a.doctor_id = ? AND DATE(a.scheduled_at) = ? AND a.status != 'Cancelled'
    `).all(doctorId, date)

const findByPatient = (patientId) =>
    db.prepare(`
        SELECT a.*,
               strftime('%Y-%m-%d', a.scheduled_at) as appointment_date,
               strftime('%H:%M',    a.scheduled_at) as appointment_time,
               p_doc.full_name as doctor_name,
               s.name as doctor_spec
        FROM appointments a
                 JOIN doctors d         ON a.doctor_id = d.id
                 JOIN specializations s ON s.id = d.specialization_id
                 JOIN patients p_doc    ON d.user_id = p_doc.user_id
        WHERE a.patient_id = ?
        ORDER BY a.scheduled_at DESC
    `).all(patientId)

const findById = (id) =>
    db.prepare(`
        SELECT a.*,
               strftime('%Y-%m-%d', a.scheduled_at) as appointment_date,
               strftime('%H:%M',    a.scheduled_at) as appointment_time,
               p.full_name  as patient_name,
               pd.full_name as doctor_name,
               s.name       as doctor_spec
        FROM appointments a
                 JOIN patients p        ON a.patient_id = p.id
                 JOIN doctors d         ON a.doctor_id = d.id
                 JOIN specializations s ON s.id = d.specialization_id
                 JOIN patients pd       ON d.user_id = pd.user_id
        WHERE a.id = ?
    `).get(id)

const findConflict = (doctorId, date, time, excludeId = null) =>
    db.prepare(`
        SELECT id FROM appointments
        WHERE doctor_id = ? AND scheduled_at = ?
          AND status != 'Cancelled'
          AND (? IS NULL OR id != ?)
    `).get(doctorId, combine(date, time), excludeId, excludeId)

const create = ({ doctor_id, patient_id, appointment_date, appointment_time, symptoms }) =>
    db.prepare(`
        INSERT INTO appointments (doctor_id, patient_id, scheduled_at, symptoms, status)
        VALUES (?, ?, ?, ?, 'Scheduled')
    `).run(doctor_id, patient_id, combine(appointment_date, appointment_time), symptoms ?? null).lastInsertRowid

const update = (id, fields) => {
    const simpleAllowed = ['symptoms', 'status', 'doctor_notes']
    const keys     = Object.keys(fields).filter(k => simpleAllowed.includes(k))
    const setParts = keys.map(k => `${k} = ?`)
    const values   = keys.map(k => fields[k])

    // Если меняются дата/время — пересобираем scheduled_at, добирая недостающую часть из текущего значения
    if (fields.appointment_date !== undefined || fields.appointment_time !== undefined) {
        const cur = db.prepare(`
            SELECT strftime('%Y-%m-%d', scheduled_at) as d, strftime('%H:%M', scheduled_at) as t
            FROM appointments WHERE id = ?
        `).get(id)
        if (cur) {
            const d = fields.appointment_date ?? cur.d
            const t = fields.appointment_time ?? cur.t
            setParts.push('scheduled_at = ?')
            values.push(combine(d, t))
        }
    }

    if (setParts.length === 0) return
    db.prepare(`UPDATE appointments SET ${setParts.join(', ')} WHERE id = ?`).run(...values, id)
}

const remove = (id) =>
    db.prepare(`DELETE FROM appointments WHERE id = ?`).run(id)

const findAll = ({ limit, offset }) =>
    db.prepare(`
        SELECT a.id,
               strftime('%Y-%m-%d', a.scheduled_at) as appointment_date,
               strftime('%H:%M',    a.scheduled_at) as appointment_time,
               a.status,
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
