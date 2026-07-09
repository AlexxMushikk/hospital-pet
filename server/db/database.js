const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')
const logger   = require('../services/logger')

const dbPath = path.join(__dirname, 'hospital.db')
const isNewDb = !fs.existsSync(dbPath)

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

if (isNewDb) {
    logger.info('New database — creating tables...')
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             email TEXT UNIQUE NOT NULL,
                                             password TEXT NOT NULL,
                                             role TEXT NOT NULL DEFAULT 'patient'
                                                 CHECK (role IN ('patient', 'doctor', 'admin')),
                                             deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS specializations (
                                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                       name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS languages (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 name TEXT UNIQUE NOT NULL
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
                                               specialization_id INTEGER NOT NULL,
                                               career_start_date TEXT,
                                               education TEXT,
                                               bio TEXT,
                                               price INTEGER DEFAULT 200,
                                               image_url TEXT,
                                               work_start TEXT DEFAULT '08:00',
                                               work_end TEXT DEFAULT '18:00',
                                               gender TEXT DEFAULT 'Not Specified'
                                                   CHECK (gender IN ('Male', 'Female', 'Not Specified')),
                                               FOREIGN KEY (user_id) REFERENCES users(id),
                                               FOREIGN KEY (specialization_id) REFERENCES specializations(id)
        );

        CREATE TABLE IF NOT EXISTS doctor_languages (
                                                        doctor_id INTEGER NOT NULL,
                                                        language_id INTEGER NOT NULL,
                                                        PRIMARY KEY (doctor_id, language_id),
                                                        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                                                        FOREIGN KEY (language_id) REFERENCES languages(id)
        );

        CREATE TABLE IF NOT EXISTS appointments (
                                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                    doctor_id INTEGER,
                                                    patient_id INTEGER,
                                                    scheduled_at TEXT NOT NULL,
                                                    status TEXT NOT NULL DEFAULT 'Scheduled'
                                                        CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
                                                    symptoms TEXT,
                                                    doctor_notes TEXT,
                                                    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
                                                    FOREIGN KEY (patient_id) REFERENCES patients(id)
        );
    `)
    logger.info('Tables created.')
}

module.exports = { db, isNewDb }
