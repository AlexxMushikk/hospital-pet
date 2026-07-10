const bcrypt           = require('bcrypt')
const userRepo         = require('../repositories/userRepo')
const patientRepo      = require('../repositories/patientRepo')
const refreshTokenRepo = require('../repositories/refreshTokenRepo')
const jwtService       = require('./jwtService')
const { loginDto, registerDto } = require('../dto/authDto')
const { db } = require('../db/database')
const logger = require('./logger')

function validate(dto, data) {
    const result = dto.safeParse(data)
    if (!result.success) {
        const err = new Error(result.error.errors[0].message)
        err.status = 400
        throw err
    }
    return result.data
}

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
        const err = new Error('Invalid credentials')
        err.status = 401
        throw err
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
        const err = new Error('Invalid credentials')
        err.status = 401
        throw err
    }

    const { password: _, ...safe } = user
    return issueSession(safe)
}

async function register(body) {
    const { email, password, full_name } = validate(registerDto, body)

    const existing = userRepo.findByEmail(email)
    if (existing) {
        const err = new Error('Email already exists')
        err.status = 400
        throw err
    }

    const hash = await bcrypt.hash(password, 10)

    const createAll = db.transaction(() => {
        const userId = userRepo.create(email, hash, 'patient')
        patientRepo.create(userId, full_name)
    })

    createAll()
}

function rotate(rawToken) {
    if (!rawToken) {
        const err = new Error('Refresh token required')
        err.status = 401
        throw err
    }

    let decoded
    try {
        decoded = jwtService.verifyRefreshToken(rawToken)
    } catch {
        const err = new Error('Invalid refresh token')
        err.status = 401
        throw err
    }

    const stored = refreshTokenRepo.findByToken(rawToken)

    if (!stored) {
        const err = new Error('Invalid refresh token')
        err.status = 401
        throw err
    }

    if (stored.revoked) {
        refreshTokenRepo.revokeAllForUser(stored.user_id)
        logger.warn({ userId: stored.user_id }, 'Refresh token reuse detected — all sessions revoked')
        const err = new Error('Session revoked')
        err.status = 401
        throw err
    }

    const user = userRepo.findById(decoded.id)
    if (!user) {
        refreshTokenRepo.revokeById(stored.id)
        const err = new Error('User not found')
        err.status = 401
        throw err
    }

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
