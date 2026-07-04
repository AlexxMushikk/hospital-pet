const express      = require('express')
const adminService = require('../services/adminService')
const verifyToken  = require('../middleware/verifyToken')

const router = express.Router()

router.use(verifyToken('admin'))

router.get('/stats', (req, res) => {
    res.json(adminService.getStats())
})

router.get('/recent-activity', (req, res) => {
    res.json(adminService.getRecentActivity())
})

router.get('/:table', (req, res) => {
    res.json(adminService.getList(req.params.table, req.query))
})

router.get('/:table/:id', (req, res) => {
    res.json(adminService.getRecord(req.params.table, req.params.id))
})

router.put('/:table/:id', (req, res) => {
    adminService.updateRecord(req.params.table, req.params.id, req.body)
    res.json({ success: true })
})

router.delete('/:table/:id', (req, res) => {
    adminService.deleteRecord(req.params.table, req.params.id)
    res.json({ success: true })
})

module.exports = router
