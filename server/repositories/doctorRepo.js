const { db } = require('../db/database')

// Языки врача в виде строки "English, Polish" (для совместимости API).
const getLanguagesStr = (doctorId) => {
    const row = db.prepare(`
        SELECT GROUP_CONCAT(l.name, ', ') as languages
        FROM doctor_languages dl
        JOIN languages l ON l.id = dl.language_id
        WHERE dl.doctor_id = ?
    `).get(doctorId)
    return row?.languages || ''
}

const setLanguages = db.transaction((doctorId, languages) => {
    const list = Array.isArray(languages) ? languages : String(languages).split(',')

    db.prepare('DELETE FROM doctor_languages WHERE doctor_id = ?').run(doctorId)

    const findLang   = db.prepare('SELECT id FROM languages WHERE name = ?')
    const insertLang = db.prepare('INSERT INTO languages (name) VALUES (?)')
    const link       = db.prepare('INSERT OR IGNORE INTO doctor_languages (doctor_id, language_id) VALUES (?, ?)')

    for (const raw of list) {
        const name = String(raw).trim()
        if (!name) continue
        const found  = findLang.get(name)
        const langId = found ? found.id : insertLang.run(name).lastInsertRowid
        link.run(doctorId, langId)
    }
})

const findAll = ({ specialization, gender, name, minExperience, minPrice, maxPrice, sort, limit, offset }) => {
    const conditions = []
    const params     = []

    if (specialization) { conditions.push('s.name = ?');         params.push(specialization) }
    if (gender)         { conditions.push('d.gender = ?');       params.push(gender) }
    if (name)           { conditions.push('p.full_name LIKE ?'); params.push(`%${name}%`) }

    if (minExperience) {
        conditions.push(`(strftime('%Y', 'now') - strftime('%Y', d.career_start_date)) >= ?`)
        params.push(minExperience)
    }

    if (minPrice !== undefined) { conditions.push('d.price >= ?'); params.push(minPrice) }
    if (maxPrice !== undefined) { conditions.push('d.price <= ?'); params.push(maxPrice) }

    const where   = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const baseSql = `
        FROM doctors d
        JOIN patients p        ON d.user_id = p.user_id
        JOIN specializations s ON s.id = d.specialization_id
        ${where}`

    const orderMap = {
        name_asc:   'p.full_name ASC',
        price_asc:  'd.price ASC',
        price_desc: 'd.price DESC',
        exp_desc:   'd.career_start_date ASC',
    }
    const order = orderMap[sort] || 'p.full_name ASC'

    const total   = db.prepare(`SELECT COUNT(*) as total ${baseSql}`).get(...params).total
    const doctors = db.prepare(
        `SELECT d.*, s.name as specialization, p.full_name as name ${baseSql} ORDER BY ${order} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset)

    return { doctors, total }
}

const findById = (id) => {
    const doctor = db.prepare(`
        SELECT d.*, s.name as specialization, p.full_name as name
        FROM doctors d
        JOIN patients p        ON d.user_id = p.user_id
        JOIN specializations s ON s.id = d.specialization_id
        WHERE d.id = ?
    `).get(id)
    if (doctor) doctor.languages = getLanguagesStr(id)
    return doctor
}

const findByUserId = (userId) => {
    const doctor = db.prepare(`
        SELECT d.*, s.name as specialization
        FROM doctors d
        JOIN specializations s ON s.id = d.specialization_id
        WHERE d.user_id = ?
    `).get(userId)
    if (doctor) doctor.languages = getLanguagesStr(doctor.id)
    return doctor
}

const create = (userId, { specialization, careerStartDate, price, gender }) =>
    db.prepare(`
        INSERT INTO doctors (user_id, specialization_id, career_start_date, price, gender)
        VALUES (?, (SELECT id FROM specializations WHERE name = ?), ?, ?, ?)
    `).run(userId, specialization, careerStartDate, price, gender).lastInsertRowid

const update = (id, { bio, education, languages, image_url }) => {
    db.prepare(
        `UPDATE doctors SET bio = ?, education = ?, image_url = ? WHERE id = ?`
    ).run(bio, education, image_url, id)
    if (languages !== undefined) setLanguages(id, languages)
}

const updateByAdmin = db.transaction((id, fields) => {
    const { languages, specialization, ...rest } = fields

    const allowed = ['career_start_date', 'education', 'bio',
        'price', 'image_url', 'work_start', 'work_end', 'gender']
    const keys    = Object.keys(rest).filter(k => allowed.includes(k))

    const setParts = keys.map(k => `${k} = ?`)
    const values   = keys.map(k => rest[k])

    if (specialization !== undefined) {
        setParts.push('specialization_id = (SELECT id FROM specializations WHERE name = ?)')
        values.push(specialization)
    }

    if (setParts.length > 0) {
        db.prepare(`UPDATE doctors SET ${setParts.join(', ')} WHERE id = ?`).run(...values, id)
    }

    if (languages !== undefined) setLanguages(id, languages)
})

const getWorkHours = (id) =>
    db.prepare(`SELECT work_start, work_end FROM doctors WHERE id = ?`).get(id)

const getPriceRange = () =>
    db.prepare(`SELECT MIN(price) as min, MAX(price) as max FROM doctors`).get()

module.exports = { findAll, findById, findByUserId, create, update, updateByAdmin, getWorkHours, getPriceRange }
