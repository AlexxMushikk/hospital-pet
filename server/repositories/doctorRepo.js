const { db } = require('../db/database')

// Список врачей с фильтрами и пагинацией
const findAll = ({ specialization, gender, name, minExperience, minPrice, maxPrice, sort, limit, offset }) => {
    const conditions = []
    const params     = []

    if (specialization) { conditions.push('d.specialization = ?'); params.push(specialization) }
    if (gender)         { conditions.push('d.gender = ?');         params.push(gender) }
    if (name)           { conditions.push('p.full_name LIKE ?');    params.push(`%${name}%`) }

    if (minExperience) {
        conditions.push(`(strftime('%Y', 'now') - strftime('%Y', d.career_start_date)) >= ?`)
        params.push(minExperience)
    }

    if (minPrice !== undefined) { conditions.push('d.price >= ?'); params.push(minPrice) }
    if (maxPrice !== undefined) { conditions.push('d.price <= ?'); params.push(maxPrice) }

    const where   = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const baseSql = `FROM doctors d JOIN patients p ON d.user_id = p.user_id ${where}`

    const orderMap = {
        name_asc:   'p.full_name ASC',
        price_asc:  'd.price ASC',
        price_desc: 'd.price DESC',
        exp_desc:   'd.career_start_date ASC',
    }
    const order = orderMap[sort] || 'p.full_name ASC'

    const total   = db.prepare(`SELECT COUNT(*) as total ${baseSql}`).get(...params).total
    const doctors = db.prepare(
        `SELECT d.*, p.full_name as name ${baseSql} ORDER BY ${order} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset)

    return { doctors, total }
}

const findById = (id) =>
    db.prepare(`
        SELECT d.*, p.full_name as name
        FROM doctors d
        JOIN patients p ON d.user_id = p.user_id
        WHERE d.id = ?
    `).get(id)

const findByUserId = (userId) =>
    db.prepare(`SELECT * FROM doctors WHERE user_id = ?`).get(userId)

const create = (userId, { specialization, careerStartDate, price, gender }) =>
    db.prepare(
        `INSERT INTO doctors (user_id, specialization, career_start_date, price, gender)
         VALUES (?, ?, ?, ?, ?)`
    ).run(userId, specialization, careerStartDate, price, gender).lastInsertRowid

const update = (id, { bio, education, languages, image_url }) =>
    db.prepare(
        `UPDATE doctors SET bio = ?, education = ?, languages = ?, image_url = ? WHERE id = ?`
    ).run(bio, education, languages, image_url, id)

const updateByAdmin = (id, fields) => {
    const allowed = ['specialization', 'career_start_date', 'education', 'bio',
        'price', 'languages', 'image_url', 'work_start', 'work_end', 'gender']
    const keys    = Object.keys(fields).filter(k => allowed.includes(k))
    if (keys.length === 0) return

    const set    = keys.map(k => `${k} = ?`).join(', ')
    const values = keys.map(k => fields[k])
    db.prepare(`UPDATE doctors SET ${set} WHERE id = ?`).run(...values, id)
}

// Получить рабочие часы для генерации слотов
const getWorkHours = (id) =>
    db.prepare(`SELECT work_start, work_end FROM doctors WHERE id = ?`).get(id)

const getPriceRange = () =>
    db.prepare(`SELECT MIN(price) as min, MAX(price) as max FROM doctors`).get()

module.exports = { findAll, findById, findByUserId, create, update, updateByAdmin, getWorkHours, getPriceRange }
