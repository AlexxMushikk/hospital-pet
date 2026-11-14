const express      = require('express')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const pinoHttp     = require('pino-http')
const helmet       = require('helmet')

const logger = require('./services/logger')
const { buildError } = require('./errors')
const { createAuthLimiters, DEFAULT_LIMITS } = require('./middleware/rateLimit')

const authRouter         = require('./routes/auth')
const doctorsRouter      = require('./routes/doctors')
const appointmentsRouter = require('./routes/appointments')
const adminRouter        = require('./routes/admin')
const statsRouter        = require('./routes/stats')

// TRUST_PROXY: how many proxies sit in front of the app (e.g. 1), so req.ip is the client's.
function trustProxySetting(value) {
    if (!value) return false
    return /^\d+$/.test(value) ? Number(value) : value
}

// authLimits: the brute-force limits on login and sign-up, or false to switch them off.
function createApp({ authLimits = DEFAULT_LIMITS } = {}) {
    const app = express()

    app.set('trust proxy', trustProxySetting(process.env.TRUST_PROXY))
    app.use(helmet())

    app.use(pinoHttp({
        logger,

        customLogLevel: (req, res, err) => {
            if (err || res.statusCode >= 500) return 'error'
            if (res.statusCode >= 400) return 'warn'
            return 'debug'
        },

        serializers: {
            req: (req) => ({
                method: req.method,
                url:    req.url,
                id:     req.id,
            }),
            res: (res) => ({
                statusCode: res.statusCode,
            }),
        },
    }))

    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }))

    app.use(express.json())
    app.use(cookieParser())

    if (authLimits) {
        const limiters = createAuthLimiters(authLimits)
        app.post('/api/login',    limiters.login)
        app.post('/api/register', limiters.register)
    }

    app.use('/api', authRouter)
    app.use('/api/doctors', doctorsRouter)
    app.use('/api/appointments', appointmentsRouter)
    app.use('/api/admin', adminRouter)
    app.use('/api/stats', statsRouter)

    app.use('/api', (req, res, next) => {
        next(buildError('errors.NOT_FOUND', 404))
    })

    app.use((err, req, res, next) => {
        const status = err.status || 500

        if (status >= 500) {
            req.log.error({ err }, 'Unhandled server error')
            const internal = buildError('errors.INTERNAL', status)
            return res.status(status).json({ error: internal.message, code: internal.code })
        }

        res.status(status).json({
            error: err.message,
            code:  err.code ?? null,
            ...(err.params ? { params: err.params } : {}),
        })
    })

    return app
}

module.exports = createApp
