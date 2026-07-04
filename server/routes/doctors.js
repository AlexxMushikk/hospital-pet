const express        = require('express')
const doctorService  = require('../services/doctorService')
const verifyToken    = require('../middleware/verifyToken')

const router = express.Router()

router.get('/', (req, res) => {
    res.json(doctorService.getDoctors(req.query))
})

router.get('/price-range', (req, res) => {
    res.json(doctorService.getPriceRange())
})

router.get('/:id/slots', verifyToken(), (req, res) => {
    res.json({ slots: doctorService.getSlots(req.params.id, req.query.date, req.user) })
})

router.get('/:id', (req, res) => {
    res.json(doctorService.getDoctorById(req.params.id))
})

router.put('/:id', verifyToken(), (req, res) => {
    doctorService.updateDoctor(req.params.id, req.body, req.user)
    res.json({ message: 'Profile updated' })
})

router.post('/', verifyToken('admin'), async (req, res) => {
    const doctorId = await doctorService.createDoctor(req.body)
    res.status(201).json({ id: doctorId })
})

module.exports = router
