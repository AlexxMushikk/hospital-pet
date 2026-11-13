const bcrypt= require('bcrypt')
const doctorRepo= require('../repositories/doctorRepo')
const userRepo= require('../repositories/userRepo')
const patientRepo= require('../repositories/patientRepo')
const appointmentRepo= require('../repositories/appointmentRepo')
const { db } = require('../db/database')

const { doctorQueryDto, updateDoctorDto, createDoctorDto } = require('../dto/doctorDto')

const { SLOT_STEP_MINUTES, BCRYPT_ROUNDS } = require('../constants')

const validate = require('../dto/validate')
const { isPast, clinicNow } = require('./clinicTime')
const { fail } = require('../errors')

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

// Latest career start that still gives `years` full years of experience today,
// e.g. 20 years on 2030-03-15 → 2010-03-15. Zero-padded, so it compares as a string.
function careerStartCutoff(years) {
    const today = clinicNow().slice(0, 10)
    return `${String(Number(today.slice(0, 4)) - years).padStart(4, '0')}${today.slice(4)}`
}

function getDoctors(query) {
    const { page, limit, specialization, gender, name, minExperience, sort, minPrice, maxPrice, excludeDoctorId } = validate(doctorQueryDto, query)
    const offset = (page - 1) * limit

    const { doctors, total } = doctorRepo.findAll({
        specialization, gender, name, sort, minPrice, maxPrice, excludeDoctorId, limit, offset,
        careerStartedBy: minExperience ? careerStartCutoff(minExperience) : undefined,
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
    if (!doctor) fail('errors.DOCTOR_NOT_FOUND', 404)
    return {
        ...doctor,
        experience: calculateExperience(doctor.career_start_date),
    }
}

function getSlots(doctorId, date, requester) {
    if (!date) fail('errors.DATE_REQUIRED', 400)

    const doctor = doctorRepo.getWorkHours(doctorId)
    if (!doctor) fail('errors.DOCTOR_NOT_FOUND', 404)

    const appointments = appointmentRepo.findByDoctor(doctorId, date)

    const privileged =
        requester?.role === 'admin' ||
        requester?.doctor_id === Number(doctorId)

    const slots   = []
    let current   = doctor.work_start
    const end     = doctor.work_end

    while (current < end) {
        const booked = appointments.find(a => a.appointment_time === current)
        // Patients cannot book a slot that is already over; the doctor still sees the real state.
        const freeStatus = !privileged && isPast(date, current) ? 'Past' : 'Free'
        slots.push({
            time:           current,
            status:         booked ? (privileged ? booked.status : 'Booked') : freeStatus,
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
    if (!doctor) fail('errors.DOCTOR_NOT_FOUND', 404)

    const isAdmin = requester.role === 'admin'
    const isOwner = requester.doctor_id === doctor.id
    if (!isAdmin && !isOwner) fail('errors.FORBIDDEN', 403)

    doctorRepo.update(id, data)
}

async function createDoctor(body) {
    const data = validate(createDoctorDto, body)

    const existing = userRepo.findByEmail(data.email)
    if (existing) fail('errors.EMAIL_EXISTS', 400)

    if (doctorRepo.findSpecializationId(data.specialization) === null) {
        fail('errors.UNKNOWN_SPECIALIZATION', 400)
    }

    const hash   = await bcrypt.hash(data.password, BCRYPT_ROUNDS)

    const createAll = db.transaction(() => {
        userRepo.releaseDeletedEmail(data.email)
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
