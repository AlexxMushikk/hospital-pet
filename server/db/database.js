const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')
const logger   = require('../services/logger')

const { applySchema } = require('./schema')

const MEMORY = ':memory:'

const rawPath = process.env.DB_PATH
const dbPath  = !rawPath
    ? path.join(__dirname, 'hospital.db')
    : rawPath === MEMORY ? MEMORY : path.resolve(rawPath)

const isNewDb = dbPath === MEMORY || !fs.existsSync(dbPath)

const db = new Database(dbPath)

if (dbPath !== MEMORY) db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

if (isNewDb) {
    logger.info({ dbPath }, 'New database — creating tables')
    applySchema(db)
}

module.exports = { db, isNewDb }
