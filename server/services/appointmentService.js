const appointmentRepo = require('../repositories/appointmentRepo')
const doctorRepo      = require('../repositories/doctorRepo')
const { createAppointmentDto, updateAppointmentDto } = require('../dto/appointmentDto')
const validate = require('../dto/validate')
const { fail } = require('../errors')
const { SLOT_STEP_MINUTES } = require('../constants')
const { isPast } = require('./clinicTime')

function assertSlotExists(doctorId, time) {
    const doctor = doctorRepo.getWorkHours(doctorId)
    if (!doctor) fail('errors.DOCTOR_NOT_FOUND', 404)

    if (time < doctor.work_start || time >= doctor.work_end) {
        fail('errors.OUTSIDE_WORKING_HOURS', 400)
    }

    const minutes = Number(time.slice(3))
    if (minutes % SLOT_STEP_MINUTES !== 0) {
        fail('errors.SLOT_STEP', 400, { minutes: SLOT_STEP_MINUTES })
    }
}

// Date and time are already validated by the DTO, so only the clinic clock matters here.
function assertNotInPast(date, time) {
    if (isPast(date, time)) fail('errors.PAST_DATE', 400)
}

function createAppointment(body, user) {
    const data = validate(createAppointmentDto, body)

    if (user.role !== 'patient' || !user.patient_id) {
        fail('errors.PATIENTS_ONLY', 403)
    }

    data.patient_id = user.patient_id

    assertSlotExists(data.doctor_id, data.appointment_time)
    assertNotInPast(data.appointment_date, data.appointment_time)

    const conflict = appointmentRepo.findConflict(
        data.doctor_id, data.appointment_date, data.appointment_time
    )
    if (conflict) fail('errors.SLOT_TAKEN', 409)

    const id = appointmentRepo.create(data)
    return { id }
}

function getPatientAppointments(patientId, requester) {
    const isAdmin = requester.role === 'admin'
    const isOwner = requester.patient_id === Number(patientId)
    const isDoctor = requester.role === 'doctor' && requester.doctor_id != null

    if (!isAdmin && !isOwner && !isDoctor) fail('errors.FORBIDDEN', 403)

    const all = appointmentRepo.findByPatient(patientId)

    if (isDoctor && !isAdmin && !isOwner) {
        return all.filter(a => a.doctor_id === requester.doctor_id)
    }

    return all
}

// Loads a visit and checks that the requester is its patient, its doctor or an admin.
function loadOwnAppointment(id, requester) {
    const app = appointmentRepo.findById(id)
    if (!app) fail('errors.APPOINTMENT_NOT_FOUND', 404)

    const isAdmin   = requester.role === 'admin'
    const isPatient = requester.patient_id === app.patient_id
    const isDoctor  = requester.doctor_id  === app.doctor_id

    if (!isAdmin && !isPatient && !isDoctor) fail('errors.FORBIDDEN', 403)

    return { app, isAdmin, isDoctor }
}

function getAppointment(id, requester) {
    return loadOwnAppointment(id, requester).app
}

function assertTransitionAllowed(currentStatus, fields) {
    const isOpen = currentStatus === 'Scheduled'

    if (fields.status !== undefined && !isOpen) {
        fail('errors.INVALID_STATUS_TRANSITION', 409)
    }
    if (fields.symptoms !== undefined && !isOpen) {
        fail('errors.APPOINTMENT_CLOSED', 409)
    }
    // Notes stay editable after completion, but a cancelled visit never took place.
    if (fields.doctor_notes !== undefined && currentStatus === 'Cancelled') {
        fail('errors.APPOINTMENT_CLOSED', 409)
    }
}

// A completed visit must always carry the doctor's notes, even if nothing was prescribed.
function assertNotesKept(app, fields) {
    const finalStatus = fields.status ?? app.status
    if (finalStatus !== 'Completed') return

    const finalNotes = fields.doctor_notes ?? app.doctor_notes
    if (!finalNotes || !finalNotes.trim()) fail('errors.NOTES_REQUIRED', 400)
}

function updateAppointment(id, body, requester) {
    const data = validate(updateAppointmentDto, body)
    const { app, isAdmin, isDoctor } = loadOwnAppointment(id, requester)

    const canManage     = isDoctor || isAdmin
    const allowedFields = canManage ? ['doctor_notes', 'status'] : ['symptoms', 'status']
    const allowedStatus = canManage ? ['Completed', 'Cancelled'] : ['Cancelled']

    const fields = {}
    for (const key of allowedFields) {
        if (data[key] !== undefined) fields[key] = data[key]
    }

    if (fields.status !== undefined && !allowedStatus.includes(fields.status)) {
        fail('errors.STATUS_CHANGE_FORBIDDEN', 403)
    }

    if (Object.keys(fields).length === 0) fail('errors.NO_EDITABLE_FIELDS', 400)

    // Admins keep full control; patients and doctors may only act on an open visit.
    if (!isAdmin) assertTransitionAllowed(app.status, fields)

    assertNotesKept(app, fields)

    appointmentRepo.update(id, fields)
}

module.exports = {
    createAppointment, getPatientAppointments, getAppointment, updateAppointment,
    assertSlotExists, assertNotInPast,
}
