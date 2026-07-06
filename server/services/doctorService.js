const bcrypt      = require('bcrypt')
const doctorRepo  = require('../repositories/doctorRepo')
const userRepo    = require('../repositories/userRepo')
const patientRepo = require('../repositories/patientRepo')
const appointmentRepo = require('../repositories/appointmentRepo')
const { db } = require('../db/database')

const { doctorQueryDto, updateDoctorDto, createDoctorDto } = require('../dto/doctorDto')

const SLOT_STEP_MINUTES = 30

function validate(dto, data) {
    const result = dto.safeParse(data)
    if (!result.success) {
        const err = new Error(result.error.errors[0].message)
        err.status = 400
        throw err
    }
    return result.data
}

function calculateExperience(startDate) {
    if (!startDate) return null
    const start = new Date(startDate)
    if (isNaN(start)) return null

    const now   = new Date()
    let years   = now.getFullYear() - start.getFullYear()
    let months  = now.getMonth()    - start.getMonth()
    if (now.getDate() < start.getDate()) months--
    if (months < 0) { years--; months += 12 }

    if (years < 0) return null

    return { years, months }
}

function getDoctors(query) {
    const { page, limit, specialization, gender, name, minExperience, sort, minPrice, maxPrice, excludeDoctorId } = validate(doctorQueryDto, query)
    const offset = (page - 1) * limit

    const { doctors, total } = doctorRepo.findAll({
        specialization, gender, name, minExperience, sort, minPrice, maxPrice, excludeDoctorId, limit, offset,
    })

    return {
        doctors: doctors.map(d => ({
            ...d,
            experience: calculateExperience(d.career_start_date),
        })),
        totalCount: total,
        page,
        totalPages: Math.ceil(total / limit),
    }
}

function getDoctorById(id) {
    const doctor = doctorRepo.findById(id)
    if (!doctor) {
        const err = new Error('Doctor not found')
        err.status = 404
        throw err
    }
    return {
        ...doctor,
        experience: calculateExperience(doctor.career_start_date),
    }
}

function getSlots(doctorId, date, requester) {
    if (!date) {
        const err = new Error('Date parameter is required')
        err.status = 400
        throw err
    }

    const doctor = doctorRepo.getWorkHours(doctorId)
    if (!doctor) {
        const err = new Error('Doctor not found')
        err.status = 404
        throw err
    }

    const appointments = appointmentRepo.findByDoctor(doctorId, date)

    const privileged =
        requester?.role === 'admin' ||
        requester?.doctor_id === Number(doctorId)

    const slots   = []
    let current   = doctor.work_start
    const end     = doctor.work_end

    while (current < end) {
        const booked = appointments.find(a => a.appointment_time === current)
        slots.push({
            time:           current,
            status:         booked ? (privileged ? booked.status : 'Booked') : 'Free',
            patient_name:   booked && privileged ? booked.patient_name   : null,
            appointment_id: booked && privileged ? booked.appointment_id : null,
        })
        let [h, m] = current.split(':').map(Number)
        m += SLOT_STEP_MINUTES
        if (m >= 60) { h++; m = 0 }
        current = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    return slots
}

function updateDoctor(id, body, requester) {
    const data = validate(updateDoctorDto, body)
    const doctor = doctorRepo.findById(id)
    if (!doctor) {
        const err = new Error('Doctor not found')
        err.status = 404
        throw err
    }

    const isAdmin = requester.role === 'admin'
    const isOwner = requester.doctor_id === doctor.id
    if (!isAdmin && !isOwner) {
        const err = new Error('Forbidden')
        err.status = 403
        throw err
    }

    doctorRepo.update(id, data)
}

// Создание врача — три INSERT в транзакции
async function createDoctor(body) {
    const data = validate(createDoctorDto, body)

    const existing = userRepo.findByEmail(data.email)
    if (existing) {
        const err = new Error('Email already exists')
        err.status = 400
        throw err
    }

    const hash   = await bcrypt.hash(data.password, 10)

    // Транзакция — всё или ничего
    const createAll = db.transaction(() => {
        const userId   = userRepo.create(data.email, hash, 'doctor')
        patientRepo.create(userId, data.full_name)
        const doctorId = doctorRepo.create(userId, {
            specialization:    data.specialization,
            careerStartDate:   data.career_start_date,
            price:             data.price,
            gender:            data.gender,
        })
        return doctorId
    })

    return createAll()
}

function getPriceRange() {
    const range = doctorRepo.getPriceRange()
    return {
        min: range.min ?? 0,
        max: range.max ?? 1000,
    }
}

module.exports = { getDoctors, getDoctorById, getSlots, updateDoctor, createDoctor, getPriceRange }
