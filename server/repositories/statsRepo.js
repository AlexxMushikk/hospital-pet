const { db } = require('../db/database')

const getPublicStats = () =>
    db.prepare(`
        SELECT
            (SELECT COUNT(*) FROM doctors d
                                      JOIN users u ON d.user_id = u.id
             WHERE u.deleted_at IS NULL) as doctorsCount,
            (SELECT COUNT(*) FROM specializations) as specializationsCount,
            (SELECT COUNT(*) FROM appointments WHERE status = 'Completed') as completedAppointments
    `).get()

module.exports = { getPublicStats }
