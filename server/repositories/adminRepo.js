const { db } = require('../db/database')

const getStats = () =>
    db.prepare(`
        SELECT
                (SELECT COUNT(*) FROM appointments) as totalApps,
                (SELECT COUNT(*) FROM doctors) as totalDocs,
                (SELECT COUNT(*) FROM users WHERE role = 'patient') as totalPats,
                (SELECT SUM(d.price) FROM appointments a
                                              JOIN doctors d ON a.doctor_id = d.id
                 WHERE a.status = 'Completed') as revenue
    `).get()

const getRecentActivity = () =>
    db.prepare(`
        SELECT a.id,
               strftime('%Y-%m-%d', a.scheduled_at) as date,
               p.full_name  as patient_name,
               pd.full_name as doctor_name,
               a.status
        FROM appointments a
                 JOIN patients p  ON a.patient_id = p.id
                 JOIN doctors d   ON a.doctor_id = d.id
                 JOIN patients pd ON d.user_id = pd.user_id
        ORDER BY a.id DESC LIMIT 5
    `).all()

const getDoctorList = ({ limit, offset, search }) => {
    const where = search ? `WHERE p.full_name LIKE ?` : ''
    const params = search ? [`%${search}%`] : []
    return db.prepare(`
        SELECT d.id, s.name as specialization, d.price, p.full_name as name
        FROM doctors d
                 JOIN patients p        ON d.user_id = p.user_id
                 JOIN specializations s ON s.id = d.specialization_id
            ${where}
        ORDER BY d.id
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset)
}

const getDoctorCount = ({ search } = {}) => {
    const where = search ? `WHERE p.full_name LIKE ?` : ''
    const params = search ? [`%${search}%`] : []
    return db.prepare(`
        SELECT COUNT(*) as total
        FROM doctors d
                 JOIN patients p ON d.user_id = p.user_id
            ${where}
    `).get(...params).total
}

const getPatientList = ({ limit, offset, search }) => {
    const where = search
        ? `WHERE u.role = 'patient' AND (p.full_name LIKE ? OR u.email LIKE ?)`
        : `WHERE u.role = 'patient'`
    const params = search ? [`%${search}%`, `%${search}%`] : []
    return db.prepare(`
        SELECT p.id, p.full_name, u.email
        FROM patients p
                 JOIN users u ON p.user_id = u.id
            ${where}
        ORDER BY p.id
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset)
}

const getPatientCount = ({ search } = {}) => {
    const where = search
        ? `WHERE u.role = 'patient' AND (p.full_name LIKE ? OR u.email LIKE ?)`
        : `WHERE u.role = 'patient'`
    const params = search ? [`%${search}%`, `%${search}%`] : []
    return db.prepare(`
        SELECT COUNT(*) as total
        FROM patients p
                 JOIN users u ON p.user_id = u.id
            ${where}
    `).get(...params).total
}

const getDoctorRecord = (id) =>
    db.prepare(`
        SELECT d.*, s.name as specialization,
               p.full_name as name, u.email, p.phone, u.role,
               (SELECT GROUP_CONCAT(l.name, ', ')
                FROM doctor_languages dl
                         JOIN languages l ON l.id = dl.language_id
                WHERE dl.doctor_id = d.id) as languages
        FROM doctors d
                 LEFT JOIN patients p        ON d.user_id = p.user_id
                 LEFT JOIN users u           ON d.user_id = u.id
                 LEFT JOIN specializations s ON s.id = d.specialization_id
        WHERE d.id = ?
    `).get(id)

const getPatientRecord = (id) =>
    db.prepare(`
        SELECT p.*, u.email, u.role
        FROM patients p
                 LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    `).get(id)

const getAppointmentRecord = (id) =>
    db.prepare(`
        SELECT a.id, a.doctor_id,
               strftime('%Y-%m-%d', a.scheduled_at) as appointment_date,
               strftime('%H:%M',    a.scheduled_at) as appointment_time,
               a.status,
               p.full_name  as patient_name,
               pd.full_name as doctor_name
        FROM appointments a
                 LEFT JOIN patients p  ON a.patient_id = p.id
                 LEFT JOIN doctors d   ON a.doctor_id = d.id
                 LEFT JOIN patients pd ON d.user_id = pd.user_id
        WHERE a.id = ?
    `).get(id)

module.exports = {
    getStats, getRecentActivity,
    getDoctorList, getDoctorCount,
    getPatientList, getPatientCount,
    getDoctorRecord, getPatientRecord,
}
