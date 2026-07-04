const statsRepo = require('../repositories/statsRepo')

function getPublicStats() {
    return statsRepo.getPublicStats()
}

module.exports = { getPublicStats }
