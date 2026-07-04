const express            = require('express')
const appointmentService = require('../services/appointmentService')
const verifyToken        = require('../middleware/verifyToken')

const router = express.Router()

router.post('/', verifyToken(), (req, res) => {
    const result = appointmentService.createAppointment(req.body, req.user)
    res.status(201).json(result)
})

router.get('/patient/:id', verifyToken(), (req, res) => {
    res.json(appointmentService.getPatientAppointments(req.params.id, req.user))
})

router.get('/:id', verifyToken(), (req, res) => {
    res.json(appointmentService.getAppointment(req.params.id, req.user))
})

router.patch('/:id', verifyToken(), (req, res) => {
    appointmentService.updateAppointment(req.params.id, req.body, req.user)
    res.json({ message: 'Updated' })
})

module.exports = router
