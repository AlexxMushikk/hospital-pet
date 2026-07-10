const express     = require('express')
const authService = require('../services/authService')

const router = express.Router()

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
}

router.post('/login', async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.json({ user, accessToken })
})

router.post('/register', async (req, res) => {
    await authService.register(req.body)
    res.status(201).json({ message: 'Success' })
})

router.post('/refresh', (req, res) => {
    const { user, accessToken, refreshToken } = authService.rotate(req.cookies?.refreshToken)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.json({ user, accessToken })
})

router.post('/logout', (req, res) => {
    authService.logout(req.cookies?.refreshToken)
    res.clearCookie('refreshToken', COOKIE_OPTIONS)
    res.json({ message: 'Logged out' })
})

module.exports = router
