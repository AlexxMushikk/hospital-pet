const { db } = require('../db/database')

const getPublicStats = () =>
    db.prepare(`
        SELECT
            (SELECT COUNT(*) FROM doctors) as doctorsCount,
            (SELECT COUNT(DISTINCT specialization) FROM doctors) as specializationsCount,
            (SELECT COUNT(*) FROM appointments WHERE status = 'Completed') as completedAppointments
    `).get()

module.exports = { getPublicStats }
