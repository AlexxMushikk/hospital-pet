const bcrypt      = require('bcrypt')
const userRepo    = require('../repositories/userRepo')
const patientRepo = require('../repositories/patientRepo')
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
    return safe
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

module.exports = { login, register }
