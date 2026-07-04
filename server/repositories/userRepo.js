const { db } = require('../db/database')

const findByEmail = (email) =>
    db.prepare(`
        SELECT u.id, u.email, u.role, u.password, u.last_view,
               p.full_name, p.id as patient_id, d.id as doctor_id
        FROM users u
                 LEFT JOIN patients p ON u.id = p.user_id
                 LEFT JOIN doctors d ON u.id = d.user_id
        WHERE u.email = ?
    `).get(email)

const create = (email, hashedPassword, role = 'patient') =>
    db.prepare(
        `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`
    ).run(email, hashedPassword, role).lastInsertRowid

const updateView = (userId, view) =>
    db.prepare(`UPDATE users SET last_view = ? WHERE id = ?`).run(view, userId)

const findById = (id) =>
    db.prepare(`
        SELECT u.id, u.email, u.role,
               p.id as patient_id, d.id as doctor_id
        FROM users u
                 LEFT JOIN patients p ON u.id = p.user_id
                 LEFT JOIN doctors d ON u.id = d.user_id
        WHERE u.id = ?
    `).get(id)

module.exports = { findByEmail, findById, create, updateView }
