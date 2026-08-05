require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const logger = require('./services/logger')

const { db, isNewDb } = require('./db/database')
const seedDatabase    = require('./db/seed')
const createApp       = require('./app')

const PORT = process.env.PORT || 3000

if (isNewDb) {
    seedDatabase(db)
}

createApp().listen(PORT, () => logger.info({ port: PORT }, 'Server started'))
