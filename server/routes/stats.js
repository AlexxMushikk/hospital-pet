const express = require('express')
const statsService = require('../services/statsService')

const router = express.Router()

router.get('/public', (req, res) => {
    res.json(statsService.getPublicStats())
})

module.exports = router
