const appointmentRepo = require('../repositories/appointmentRepo')
const doctorRepo      = require('../repositories/doctorRepo')
const { createAppointmentDto, updateAppointmentDto } = require('../dto/appointmentDto')
const { SLOT_STEP_MINUTES } = require('../constants')

function validate(dto, data) {
    const result = dto.safeParse(data)
    if (!result.success) {
        const err = new Error(result.error.issues[0].message)
        err.status = 400
        throw err
    }
    return result.data
}

function fail(message, status) {
    const err = new Error(message)
    err.status = status
    throw err
}

function assertSlotExists(doctorId, time) {
    const doctor = doctorRepo.getWorkHours(doctorId)
    if (!doctor) fail('Doctor not found', 404)

    if (time < doctor.work_start || time >= doctor.work_end) {
        fail('Time is outside the doctor working hours', 400)
    }

    const minutes = Number(time.slice(3))
    if (minutes % SLOT_STEP_MINUTES !== 0) {
        fail(`Appointments start every ${SLOT_STEP_MINUTES} minutes`, 400)
    }
}

function assertNotInPast(date, time) {
    const scheduled = new Date(`${date}T${time}:00`)
    if (Number.isNaN(scheduled.getTime())) fail('Invalid date or time', 400)
    if (scheduled.getTime() < Date.now()) fail('Cannot book a slot in the past', 400)
}

function createAppointment(body, user) {
    const data = validate(createAppointmentDto, body)

    if (user.role !== 'patient' || !user.patient_id) {
        fail('Only patients can book appointments', 403)
    }

    data.patient_id = user.patient_id

    assertSlotExists(data.doctor_id, data.appointment_time)
    assertNotInPast(data.appointment_date, data.appointment_time)

    const conflict = appointmentRepo.findConflict(
        data.doctor_id, data.appointment_date, data.appointment_time
    )
    if (conflict) fail('This slot is already booked', 409)

    const id = appointmentRepo.create(data)
    return { id }
}

function getPatientAppointments(patientId, requester) {
    const isAdmin = requester.role === 'admin'
    const isOwner = requester.patient_id === Number(patientId)
    const isDoctor = requester.role === 'doctor' && requester.doctor_id != null

    if (!isAdmin && !isOwner && !isDoctor) {
        const err = new Error('Forbidden')
        err.status = 403
        throw err
    }

    const all = appointmentRepo.findByPatient(patientId)

    if (isDoctor && !isAdmin && !isOwner) {
        return all.filter(a => a.doctor_id === requester.doctor_id)
    }

    return all
}

function getAppointment(id, requester) {
    const app = appointmentRepo.findById(id)
    if (!app) {
        const err = new Error('Appointment not found')
        err.status = 404
        throw err
    }

    const isAdmin   = requester.role === 'admin'
    const isPatient = requester.patient_id === app.patient_id
    const isDoctor  = requester.doctor_id  === app.doctor_id

    if (!isAdmin && !isPatient && !isDoctor) {
        const err = new Error('Forbidden')
        err.status = 403
        throw err
    }

    return app
}

function updateAppointment(id, body, requester) {
    const data = validate(updateAppointmentDto, body)
    const app  = appointmentRepo.findById(id)
    if (!app) {
        const err = new Error('Appointment not found')
        err.status = 404
        throw err
    }

    const isAdmin   = requester.role === 'admin'
    const isPatient = requester.patient_id === app.patient_id
    const isDoctor  = requester.doctor_id  === app.doctor_id

    if (!isAdmin && !isPatient && !isDoctor) {
        const err = new Error('Forbidden')
        err.status = 403
        throw err
    }

    const canManage     = isDoctor || isAdmin
    const allowedFields = canManage ? ['doctor_notes', 'status'] : ['symptoms', 'status']
    const allowedStatus = canManage ? ['Completed', 'Cancelled'] : ['Cancelled']

    const fields = {}
    for (const key of allowedFields) {
        if (data[key] !== undefined) fields[key] = data[key]
    }

    if (fields.status !== undefined && !allowedStatus.includes(fields.status)) {
        const err = new Error('Недопустимая смена статуса для вашей роли')
        err.status = 403
        throw err
    }

    if (Object.keys(fields).length === 0) {
        const err = new Error('Нет полей, доступных для изменения')
        err.status = 400
        throw err
    }

    appointmentRepo.update(id, fields)
}

module.exports = { createAppointment, getPatientAppointments, getAppointment, updateAppointment }
