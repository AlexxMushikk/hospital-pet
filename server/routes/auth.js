const express      = require('express')
const authService  = require('../services/authService')
const jwtService   = require('../services/jwtService')
const userRepo     = require('../repositories/userRepo')

const router = express.Router()

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
}

router.post('/login', async (req, res) => {
    const user = await authService.login(req.body)

    const accessToken  = jwtService.createAccessToken({
        id:    user.id,
        email: user.email,
        role:  user.role,
        patient_id: user.patient_id,
        doctor_id:  user.doctor_id,
    })
    const refreshToken = jwtService.createRefreshToken({ id: user.id })

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.json({ user, accessToken })
})

router.post('/register', async (req, res) => {
    await authService.register(req.body)
    res.status(201).json({ message: 'Success' })
})

router.post('/refresh', (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
        const err = new Error('Refresh token required')
        err.status = 401
        throw err
    }

    let decoded
    try {
        decoded = jwtService.verifyRefreshToken(refreshToken)
    } catch {
        const err = new Error('Invalid refresh token')
        err.status = 401
        throw err
    }

    const user = userRepo.findById(decoded.id)
    if (!user) {
        const err = new Error('User not found')
        err.status = 401
        throw err
    }

    const accessToken = jwtService.createAccessToken({
        id:         user.id,
        email:      user.email,
        role:       user.role,
        patient_id: user.patient_id,
        doctor_id:  user.doctor_id,
    })

    const newRefreshToken = jwtService.createRefreshToken({ id: user.id })
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)

    res.json({ user, accessToken })
})

router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', COOKIE_OPTIONS)
    res.json({ message: 'Logged out' })
})

module.exports = router
