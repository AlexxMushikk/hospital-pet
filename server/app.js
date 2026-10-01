const express      = require('express')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const pinoHttp     = require('pino-http')

const logger = require('./services/logger')
const { buildError } = require('./errors')

const authRouter         = require('./routes/auth')
const doctorsRouter      = require('./routes/doctors')
const appointmentsRouter = require('./routes/appointments')
const adminRouter        = require('./routes/admin')
const statsRouter        = require('./routes/stats')

function createApp() {
    const app = express()

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
