const adminRepo       = require('../repositories/adminRepo')
const appointmentRepo = require('../repositories/appointmentRepo')
const doctorRepo      = require('../repositories/doctorRepo')
const patientRepo     = require('../repositories/patientRepo')
const userRepo        = require('../repositories/userRepo')
const refreshTokenRepo = require('../repositories/refreshTokenRepo')
const { db } = require('../db/database')
const validate = require('../dto/validate')
const { fail } = require('../errors')
const { SLOT_STEP_MINUTES } = require('../constants')
const { assertSlotExists, assertNotInPast } = require('./appointmentService')
const {
    paginationDto,
    updateDoctorByAdminDto,
    updatePatientByAdminDto,
    updateAppointmentByAdminDto,
} = require('../dto/adminDto')

function assertEmailFree(email, userId) {
    const owner = userRepo.findIdByEmail(email)
    if (owner !== null && owner !== userId) fail('errors.EMAIL_EXISTS', 400)
}

function assertValidShift(doctor, data) {
    if (data.work_start === undefined && data.work_end === undefined) return

    for (const time of [data.work_start, data.work_end]) {
        if (time !== undefined && Number(time.slice(3)) % SLOT_STEP_MINUTES !== 0) {
            fail('validation.shiftGrid', 400, { minutes: SLOT_STEP_MINUTES })
        }
    }

    const start = data.work_start ?? doctor.work_start
    const end   = data.work_end   ?? doctor.work_end
    if (start >= end) fail('validation.shiftStartAfterEnd', 400)
}

const ALLOWED_TABLES = ['doctors', 'patients', 'appointments']

function assertTable(table) {
    if (!ALLOWED_TABLES.includes(table)) fail('errors.INVALID_TABLE', 400)
}

function getStats() {
    const row = adminRepo.getStats()
    return {
        totalAppointments: row.totalApps,
        activeDoctors:     row.totalDocs,
        totalPatients:     row.totalPats,
        totalRevenue:      row.revenue || 0,
    }
}

function getRecentActivity() {
    return adminRepo.getRecentActivity()
}

function getList(table, query) {
    assertTable(table)
    const { page, limit } = validate(paginationDto, query)
    const offset = (page - 1) * limit
    const search = typeof query.search === 'string' && query.search.trim()
        ? query.search.trim()
        : null

    if (table === 'doctors') {
        const data  = adminRepo.getDoctorList({ limit, offset, search })
        const total = adminRepo.getDoctorCount({ search })
        return { data, totalCount: total, page, totalPages: Math.ceil(total / limit) }
    }
    if (table === 'patients') {
        const data  = adminRepo.getPatientList({ limit, offset, search })
        const total = adminRepo.getPatientCount({ search })
        return { data, totalCount: total, page, totalPages: Math.ceil(total / limit) }
    }
    const data  = appointmentRepo.findAll({ limit, offset })
    const total = appointmentRepo.count()
    return { data, totalCount: total, page, totalPages: Math.ceil(total / limit) }
}

function getRecord(table, id) {
    assertTable(table)
    const getters = {
        doctors:      () => adminRepo.getDoctorRecord(id),
        patients:     () => adminRepo.getPatientRecord(id),
        appointments: () => appointmentRepo.findById(id),
    }
    const record = getters[table]()
    if (!record) fail('errors.NOT_FOUND', 404)
    return record
}

function updateRecord(table, id, body) {
    assertTable(table)

    const dtoMap = {
        doctors:      updateDoctorByAdminDto,
        patients:     updatePatientByAdminDto,
        appointments: updateAppointmentByAdminDto,
    }
    const data = validate(dtoMap[table], body)

    const execute = db.transaction(() => {
        if (table === 'doctors') {
            const doctor = doctorRepo.findById(id)
            if (!doctor) fail('errors.DOCTOR_NOT_FOUND', 404)

            if (data.specialization !== undefined
                && doctorRepo.findSpecializationId(data.specialization) === null) {
                fail('errors.UNKNOWN_SPECIALIZATION', 400)
            }

            if (data.email) assertEmailFree(data.email, doctor.user_id)

            assertValidShift(doctor, data)

            doctorRepo.updateByAdmin(id, data)

            if (data.full_name || data.phone) {
                patientRepo.updateByUserId(doctor.user_id, {
                    full_name: data.full_name,
                    phone:     data.phone,
                })
            }
            if (data.email) {
                userRepo.releaseDeletedEmail(data.email)
                userRepo.updateEmail(doctor.user_id, data.email)
            }
        }

        if (table === 'patients') {
            const patient = adminRepo.getPatientRecord(id)
            if (!patient) fail('errors.PATIENT_NOT_FOUND', 404)

            if (data.email) assertEmailFree(data.email, patient.user_id)

            if (data.full_name || data.phone) {
                patientRepo.updateByUserId(patient.user_id, {
                    full_name: data.full_name,
                    phone:     data.phone,
                })
            }
            if (data.email) {
                userRepo.releaseDeletedEmail(data.email)
                userRepo.updateEmail(patient.user_id, data.email)
            }
        }

        if (table === 'appointments') {
            const current = appointmentRepo.findById(id)
            if (!current) fail('errors.APPOINTMENT_NOT_FOUND', 404)

            const movingSlot   = data.appointment_date !== undefined
                || data.appointment_time !== undefined
            const finalStatus  = data.status ?? current.status
            const reactivating = current.status === 'Cancelled' && finalStatus !== 'Cancelled'

            const newDate = data.appointment_date ?? current.appointment_date
            const newTime = data.appointment_time ?? current.appointment_time

            if (movingSlot) assertSlotExists(current.doctor_id, newTime)

            // Completed visits may be corrected retroactively; a scheduled one must stay in the future.
            if (finalStatus === 'Scheduled' && (movingSlot || current.status !== 'Scheduled')) {
                assertNotInPast(newDate, newTime)
            }

            if ((movingSlot || reactivating) && finalStatus !== 'Cancelled') {
                const conflict = appointmentRepo.findConflict(
                    current.doctor_id, newDate, newTime, id
                )
                if (conflict) fail('errors.SLOT_TAKEN', 409)
            }

            appointmentRepo.update(id, data)
        }
    })

    execute()
}

function deleteRecord(table, id) {
    assertTable(table)

    if (table === 'doctors') {
        const doctor = doctorRepo.findUserId(id)
        if (!doctor) fail('errors.DOCTOR_NOT_FOUND', 404)

        const execute = db.transaction(() => {
            appointmentRepo.cancelScheduledByDoctor(id)
            userRepo.softDelete(doctor.user_id)
            refreshTokenRepo.revokeAllForUser(doctor.user_id)
        })
        execute()
        return
    }

    if (table === 'patients') {
        const patient = adminRepo.getPatientRecord(id)
        if (!patient) fail('errors.PATIENT_NOT_FOUND', 404)

        if (patient.role === 'admin') fail('errors.ADMIN_DELETE_FORBIDDEN', 409)

        // Doctors also own a patients row (for their name), but deleting one here would skip
        // cancelling their schedule. They are removed through the doctors table instead.
        if (patient.role !== 'patient') fail('errors.PATIENT_NOT_FOUND', 404)

        const execute = db.transaction(() => {
            appointmentRepo.cancelScheduledByPatient(id)
            userRepo.softDelete(patient.user_id)
            refreshTokenRepo.revokeAllForUser(patient.user_id)
        })
        execute()
        return
    }

    if (table === 'appointments') {
        const { changes } = appointmentRepo.remove(id)
        if (changes === 0) fail('errors.APPOINTMENT_NOT_FOUND', 404)
        return
    }
}

module.exports = { getStats, getRecentActivity, getList, getRecord, updateRecord, deleteRecord }
