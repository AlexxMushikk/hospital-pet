const { rateLimit, ipKeyGenerator } = require('express-rate-limit')

const { buildError } = require('../errors')
const {
    AUTH_RATE_WINDOW_MINUTES,
    LOGIN_MAX_FAILED_ATTEMPTS,
    REGISTER_MAX_ATTEMPTS,
} = require('../constants')

const DEFAULT_LIMITS = {
    windowMinutes: AUTH_RATE_WINDOW_MINUTES,
    login:         LOGIN_MAX_FAILED_ATTEMPTS,
    register:      REGISTER_MAX_ATTEMPTS,
}

const clientIp = (req) => ipKeyGenerator(req.ip)
const email    = (req) => String(req.body?.email ?? '').trim().toLowerCase()

// Each app gets its own limiters, and with them its own counters.
function createAuthLimiters(limits = DEFAULT_LIMITS) {
    const { windowMinutes } = limits

    const base = {
        windowMs:        windowMinutes * 60 * 1000,
        standardHeaders: 'draft-8',
        legacyHeaders:   false,
        handler: (req, res, next, options) =>
            next(buildError('errors.TOO_MANY_ATTEMPTS', options.statusCode, { minutes: windowMinutes })),
        // Behind a proxy without TRUST_PROXY every request shares the proxy's address;
        // the login key still tells accounts apart by email.
        validate: { xForwardedForHeader: false },
    }

    return {
        login: rateLimit({
            ...base,
            limit: limits.login,
            skipSuccessfulRequests: true,
            keyGenerator: (req) => `${clientIp(req)}|${email(req)}`,
        }),
        register: rateLimit({
            ...base,
            limit: limits.register,
            keyGenerator: clientIp,
        }),
    }
}

module.exports = { createAuthLimiters, DEFAULT_LIMITS }
