const jwt = require('jsonwebtoken')

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error(
        'JWT secrets not set. Copy server/.env.example to server/.env and fill JWT_ACCESS_SECRET / JWT_REFRESH_SECRET.'
    )
}

const ACCESS_EXPIRES  = '15m'
const REFRESH_EXPIRES = '7d'

function createAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES })
}

function createRefreshToken(payload) {
    return jwt.sign({ id: payload.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES })
}

function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET)
}

function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET)
}

module.exports = { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken }
