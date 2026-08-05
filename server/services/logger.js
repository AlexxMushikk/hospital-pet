const pino = require('pino')

const isPretty = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'

const logger = pino({
    level: process.env.LOG_LEVEL || (isPretty ? 'debug' : 'info'),
    ...(isPretty && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },
    }),
})

module.exports = logger
