const { db } = require('../db/database')

const create = (userId, fullName, phone = null) =>
    db.prepare(
        `INSERT INTO patients (user_id, full_name, phone) VALUES (?, ?, ?)`
    ).run(userId, fullName, phone).lastInsertRowid

const findById = (id) =>
    db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id)

const updateByUserId = (userId, { full_name, phone }) =>
    db.prepare(
        `UPDATE patients SET
            full_name = COALESCE(?, full_name),
            phone     = COALESCE(?, phone)
         WHERE user_id = ?`
    ).run(full_name, phone, userId)

module.exports = { create, findById, updateByUserId }