const crypto = require('crypto')
const { db } = require('../db/database')

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex')

const store = (userId, token) =>
    db.prepare(`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (?, ?, datetime('now', '+7 days'))
    `).run(userId, hash(token))

const findByToken = (token) =>
    db.prepare(
        `SELECT id, user_id, revoked FROM refresh_tokens WHERE token_hash = ?`
    ).get(hash(token))

const revokeById = (id) =>
    db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE id = ?`).run(id)

const revokeAllForUser = (userId) =>
    db.prepare(
        `UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND revoked = 0`
    ).run(userId)

const pruneExpired = () =>
    db.prepare(`DELETE FROM refresh_tokens WHERE expires_at < datetime('now')`).run()

module.exports = { store, findByToken, revokeById, revokeAllForUser, pruneExpired }
