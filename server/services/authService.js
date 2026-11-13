const bcrypt           = require('bcrypt')
const userRepo         = require('../repositories/userRepo')
const patientRepo      = require('../repositories/patientRepo')
const refreshTokenRepo = require('../repositories/refreshTokenRepo')
const jwtService       = require('./jwtService')
const { loginDto, registerDto } = require('../dto/authDto')
const { db } = require('../db/database')
const validate = require('../dto/validate')
const { fail } = require('../errors')
const { BCRYPT_ROUNDS, REFRESH_REUSE_GRACE_SECONDS } = require('../constants')
const logger = require('./logger')

function accessPayload(user) {
    return {
        id:         user.id,
        email:      user.email,
        role:       user.role,
        patient_id: user.patient_id,
        doctor_id:  user.doctor_id,
    }
}

function issueSession(user) {
    const accessToken  = jwtService.createAccessToken(accessPayload(user))
    const refreshToken = jwtService.createRefreshToken({ id: user.id })
    refreshTokenRepo.store(user.id, refreshToken)
    return { user, accessToken, refreshToken }
}

async function login(body) {
    const { email, password } = validate(loginDto, body)

    const user = userRepo.findByEmail(email)
    if (!user) {
        logger.warn({ email }, 'Login failed: user not found')
        fail('errors.INVALID_CREDENTIALS', 401)
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
        fail('errors.INVALID_CREDENTIALS', 401)
    }

    const { password: _, ...safe } = user
    return issueSession(safe)
}

async function register(body) {
    const { email, password, full_name } = validate(registerDto, body)

    const existing = userRepo.findByEmail(email)
    if (existing) {
        fail('errors.EMAIL_EXISTS', 400)
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const createAll = db.transaction(() => {
        userRepo.releaseDeletedEmail(email)
        const userId = userRepo.create(email, hash, 'patient')
        patientRepo.create(userId, full_name)
    })

    createAll()
}

function rotate(rawToken) {
    if (!rawToken) {
        fail('errors.REFRESH_TOKEN_REQUIRED', 401)
    }

    let decoded
    try {
        decoded = jwtService.verifyRefreshToken(rawToken)
    } catch {
        fail('errors.INVALID_REFRESH_TOKEN', 401)
    }

    const stored = refreshTokenRepo.findByToken(rawToken)

    if (!stored) {
        fail('errors.INVALID_REFRESH_TOKEN', 401)
    }

    // Two tabs share one cookie: when both refresh at once, the slower one presents a token
    // the faster one has just replaced. That is a race, not theft, so it gets a session too.
    const racedAnotherTab = stored.revoked
        && refreshTokenRepo.rotatedWithin(stored.user_id, REFRESH_REUSE_GRACE_SECONDS)

    if (stored.revoked && !racedAnotherTab) {
        refreshTokenRepo.revokeAllForUser(stored.user_id)
        logger.warn({ userId: stored.user_id }, 'Refresh token reuse detected — all sessions revoked')
        fail('errors.SESSION_REVOKED', 401)
    }

    const user = userRepo.findById(decoded.id)
    if (!user) {
        refreshTokenRepo.revokeById(stored.id)
        fail('errors.USER_NOT_FOUND', 401)
    }

    if (racedAnotherTab) return issueSession(user)

    const exec = db.transaction(() => {
        refreshTokenRepo.revokeById(stored.id)
        return issueSession(user)
    })
    return exec()
}

function logout(rawToken) {
    if (!rawToken) return
    const stored = refreshTokenRepo.findByToken(rawToken)
    if (stored) refreshTokenRepo.revokeById(stored.id)
}

module.exports = { login, register, rotate, logout }
