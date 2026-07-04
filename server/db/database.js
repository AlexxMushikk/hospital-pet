const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')
const logger   = require('../services/logger')

const dbPath = path.join(__dirname, 'hospital.db')
const isNewDb = !fs.existsSync(dbPath)

// better-sqlite3 — синхронный, открывается сразу без колбэка
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')  // лучшая производительность при записи
db.pragma('foreign_keys = ON')   // проверка внешних ключей

if (isNewDb) {
    logger.info('New database — creating tables...')
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'patient',
            last_view TEXT DEFAULT 'patient'
        );

        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            full_name TEXT NOT NULL,
            phone TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            specialization TEXT NOT NULL,
            career_start_date TEXT,
            education TEXT,
            bio TEXT,
            price INTEGER DEFAULT 200,
            languages TEXT,
            image_url TEXT,
            work_start TEXT DEFAULT '08:00',
            work_end TEXT DEFAULT '18:00',
            gender TEXT DEFAULT 'Not Specified',
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id INTEGER,
            patient_id INTEGER,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            status TEXT DEFAULT 'Scheduled',
            symptoms TEXT,
            doctor_notes TEXT,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id),
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        );
    `)
    logger.info('Tables created.')
}

// Три метода которые будем использовать везде:
// db.prepare(sql).get(params)    — один результат
// db.prepare(sql).all(params)    — массив результатов
// db.prepare(sql).run(params)    — INSERT/UPDATE/DELETE → { lastInsertRowid, changes }

module.exports = { db, isNewDb }
