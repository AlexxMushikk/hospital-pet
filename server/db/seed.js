const logger = require('../services/logger')
const bcrypt = require('bcrypt')
const SALT_ROUNDS = 10

function h(password) {
    return bcrypt.hashSync(password, SALT_ROUNDS)
}

// Дата YYYY-MM-DD со сдвигом в днях от сегодня (по локальному времени).
function dateFromToday(offsetDays) {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    const y   = d.getFullYear()
    const m   = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

// Собирает scheduled_at в формате 'YYYY-MM-DD HH:MM:SS'.
function scheduledAt(dateStr, timeStr) {
    return `${dateStr} ${timeStr}:00`
}

// Детерминированный набор языков врача по индексу.
function langsFor(i) {
    const langs = ['English']
    if (i % 2 === 0) langs.push('Polish')
    if (i % 3 === 0) langs.push('Russian')
    return langs
}

function seedDatabase(db) {
    logger.info('Seeding database')

    const seed = db.transaction(() => {

        // Очищаем в правильном порядке — сначала зависимые
        db.prepare('DELETE FROM appointments').run()
        db.prepare('DELETE FROM doctor_languages').run()
        db.prepare('DELETE FROM doctors').run()
        db.prepare('DELETE FROM patients').run()
        db.prepare('DELETE FROM languages').run()
        db.prepare('DELETE FROM specializations').run()
        db.prepare('DELETE FROM users').run()

        // ── SPECIALIZATIONS ────────────────────────────────────────────
        const specNames  = ['Cardiology', 'Neurology', 'Diagnostics', 'Surgery', 'Pediatrics', 'General Examination']
        const insertSpec  = db.prepare(`INSERT INTO specializations (name) VALUES (?)`)
        const specIds     = {}
        for (const name of specNames) {
            specIds[name] = insertSpec.run(name).lastInsertRowid
        }

        // ── LANGUAGES ──────────────────────────────────────────────────
        const langNames  = ['English', 'Polish', 'Russian', 'German', 'French', 'Spanish']
        const insertLang  = db.prepare(`INSERT INTO languages (name) VALUES (?)`)
        const langIds     = {}
        for (const name of langNames) {
            langIds[name] = insertLang.run(name).lastInsertRowid
        }

        // ── ADMIN ──────────────────────────────────────────────────────
        const adminUser = db.prepare(
            `INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')`
        ).run('admin@hospital.com', h('admin123'))

        db.prepare(
            `INSERT INTO patients (user_id, full_name, phone) VALUES (?, ?, ?)`
        ).run(adminUser.lastInsertRowid, 'System Administrator', '+100000000')

        // ── TEST PATIENT ───────────────────────────────────────────────
        const testUser = db.prepare(
            `INSERT INTO users (email, password, role) VALUES (?, ?, 'patient')`
        ).run('test@gmail.com', h('testtest'))

        const testPatient = db.prepare(
            `INSERT INTO patients (user_id, full_name, phone) VALUES (?, ?, ?)`
        ).run(testUser.lastInsertRowid, 'Test User', '+79991234567')

        const testPatientId = testPatient.lastInsertRowid

        // ── DOCTORS ────────────────────────────────────────────────────
        const doctorData = [
            { email: 'cuddy@med.com',    name: 'Dr. Lisa Cuddy',      spec: 'Diagnostics',         gender: 'Female', start: '2010-03-20' },
            { email: 'house@med.com',    name: 'Dr. Gregory House',   spec: 'Diagnostics',         gender: 'Male',   start: '2004-11-16' },
            { email: 'cameron@med.com',  name: 'Dr. Allison Cameron', spec: 'Diagnostics',         gender: 'Female', start: '2012-05-10' },
            { email: 'wilson@med.com',   name: 'Dr. James Wilson',    spec: 'Cardiology',          gender: 'Male',   start: '2008-09-01' },
            { email: 'yang@med.com',     name: 'Dr. Cristina Yang',   spec: 'Cardiology',          gender: 'Female', start: '2013-11-30' },
            { email: 'melendez@med.com', name: 'Dr. Neil Melendez',   spec: 'Cardiology',          gender: 'Male',   start: '2015-03-15' },
            { email: 'foreman@med.com',  name: 'Dr. Eric Foreman',    spec: 'Neurology',           gender: 'Male',   start: '2011-05-10' },
            { email: 'shepherd@med.com', name: 'Dr. Derek Shepherd',  spec: 'Surgery',             gender: 'Male',   start: '2005-04-05' },
            { email: 'grey@med.com',     name: 'Dr. Meredith Grey',   spec: 'Surgery',             gender: 'Female', start: '2014-09-12' },
            { email: 'sloan@med.com',    name: 'Dr. Mark Sloan',      spec: 'Surgery',             gender: 'Male',   start: '2009-02-14' },
            { email: 'bailey@med.com',   name: 'Dr. Miranda Bailey',  spec: 'Surgery',             gender: 'Female', start: '2006-10-10' },
            { email: 'murphy@med.com',   name: 'Dr. Shaun Murphy',    spec: 'Surgery',             gender: 'Male',   start: '2019-09-22' },
            { email: 'chase@med.com',    name: 'Dr. Robert Chase',    spec: 'Surgery',             gender: 'Male',   start: '2014-08-15' },
            { email: 'karev@med.com',    name: 'Dr. Alex Karev',      spec: 'Pediatrics',          gender: 'Male',   start: '2017-06-01' },
            { email: 'brown@med.com',    name: 'Dr. Claire Brown',    spec: 'General Examination', gender: 'Female', start: '2020-01-10' },
        ]

        const insertUser    = db.prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, 'doctor')`)
        const insertPatient = db.prepare(`INSERT INTO patients (user_id, full_name) VALUES (?, ?)`)
        const insertDoctor  = db.prepare(`INSERT INTO doctors (user_id, specialization_id, career_start_date, price, gender) VALUES (?, ?, ?, ?, ?)`)
        const insertDocLang = db.prepare(`INSERT INTO doctor_languages (doctor_id, language_id) VALUES (?, ?)`)

        const docIds = {}
        let di = 0
        for (const d of doctorData) {
            const user   = insertUser.run(d.email, h('doctor123'))
            insertPatient.run(user.lastInsertRowid, d.name)

            const price  = 150 + (di * 20) % 200
            const doctor = insertDoctor.run(
                user.lastInsertRowid,
                specIds[d.spec],
                d.start,
                price,
                d.gender
            )
            docIds[d.email] = doctor.lastInsertRowid

            for (const lang of langsFor(di)) {
                insertDocLang.run(doctor.lastInsertRowid, langIds[lang])
            }
            di++
        }

        // ── OTHER PATIENTS ─────────────────────────────────────────────
        const names = [
            'Harvey Specter', 'Donna Paulsen', 'Michael Ross', 'Rachel Zane', 'Louis Litt',
            'Walter White', 'Jesse Pinkman', 'Tony Stark', 'Steve Rogers', 'Natasha Romanoff',
            'Bruce Banner', 'Wanda Maximoff', 'Peter Parker', 'Thor Odinson', 'Bruce Wayne',
            'Diana Prince', 'Clark Kent', 'Barry Allen', 'Arthur Curry'
        ]

        const insertOtherUser    = db.prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, 'patient')`)
        const insertOtherPatient = db.prepare(`INSERT INTO patients (user_id, full_name) VALUES (?, ?)`)

        const allPatientIds = [testPatientId]
        for (const name of names) {
            const email   = name.toLowerCase().replaceAll(' ', '.') + '@mail.com'
            const user    = insertOtherUser.run(email, h('pass123'))
            const patient = insertOtherPatient.run(user.lastInsertRowid, name)
            allPatientIds.push(patient.lastInsertRowid)
        }

        // ── APPOINTMENTS ───────────────────────────────────────────────
        const insertApp = db.prepare(`
            INSERT INTO appointments (doctor_id, patient_id, scheduled_at, status)
            VALUES (?, ?, ?, ?)
        `)

        const cuddyId   = docIds['cuddy@med.com']
        const allDocIds = Object.values(docIds)

        // Записи к Dr. Cuddy на ближайшие дни (Scheduled)
        const slots = ['09:00', '10:30', '14:00', '15:30']
        for (let dayOffset = 1; dayOffset <= 4; dayOffset++) {
            const date = dateFromToday(dayOffset)
            for (let i = 0; i < 4; i++) {
                insertApp.run(
                    cuddyId,
                    allPatientIds[i % allPatientIds.length],
                    scheduledAt(date, slots[i]),
                    'Scheduled'
                )
            }
        }

        // Тестовый пациент — записи с разными статусами
        // Completed/Cancelled — в прошлом, Scheduled — в будущем
        const statuses = ['Scheduled', 'Completed', 'Cancelled']
        for (let i = 0; i < 9; i++) {
            const status = statuses[Math.floor(i / 3)]
            const offset = status === 'Scheduled' ? (i + 1) : -(i + 1)
            const date   = dateFromToday(offset)
            insertApp.run(allDocIds[i % 15], testPatientId, scheduledAt(date, '12:00'), status)
        }

        // Завершённые записи для статистики дохода (в прошлом)
        for (let i = 0; i < 20; i++) {
            const date = dateFromToday(-(30 + i))
            insertApp.run(
                allDocIds[i % 15],
                allPatientIds[i % allPatientIds.length],
                scheduledAt(date, '08:00'),
                'Completed'
            )
        }
    })

    seed()
    logger.info('Seeding finished!')
}

module.exports = seedDatabase
