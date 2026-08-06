import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const { db }     = require('../../db/database.js')
const { TABLES } = require('../../db/schema.js')

export function resetDb() {
    db.pragma('foreign_keys = OFF')

    for (const table of TABLES) {
        db.prepare(`DELETE FROM ${table}`).run()
    }

    const hasSequence = db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sqlite_sequence'`)
        .get()
    if (hasSequence) db.prepare('DELETE FROM sqlite_sequence').run()

    db.pragma('foreign_keys = ON')
}

export { db }
