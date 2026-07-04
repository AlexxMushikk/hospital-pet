const appointmentRepo = require('../repositories/appointmentRepo')
const { createAppointmentDto, updateAppointmentDto } = require('../dto/appointmentDto')

function validate(dto, data) {
    const result = dto.safeParse(data)
    if (!result.success) {
        const err = new Error(result.error.errors[0].message)
        err.status = 400
        throw err
    }
    return result.data
}

function createAppointment(body, user) {
    const data = validate(createAppointmentDto, body)

    data.patient_id = user.patient_id

    const conflict = appointmentRepo.findConflict(
        data.doctor_id, data.appointment_date, data.appointment_time
    )
    if (conflict) {
        const err = new Error('This slot is already booked')
        err.status = 409
        throw err
    }

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
