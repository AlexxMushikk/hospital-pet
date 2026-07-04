const adminRepo       = require('../repositories/adminRepo')
const appointmentRepo = require('../repositories/appointmentRepo')
const doctorRepo      = require('../repositories/doctorRepo')
const patientRepo     = require('../repositories/patientRepo')
const { db } = require('../db/database')
const {
    paginationDto,
    updateDoctorByAdminDto,
    updatePatientByAdminDto,
    updateAppointmentByAdminDto,
} = require('../dto/adminDto')

function validate(dto, data) {
    const result = dto.safeParse(data)
    if (!result.success) {
        const err = new Error(result.error.errors[0].message)
        err.status = 400
        throw err
    }
    return result.data
}

const ALLOWED_TABLES = ['doctors', 'patients', 'appointments']

function assertTable(table) {
    if (!ALLOWED_TABLES.includes(table)) {
        const err = new Error('Invalid table')
        err.status = 400
        throw err
    }
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
    // appointments — поиск не поддерживается
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
    if (!record) {
        const err = new Error('Not found')
        err.status = 404
        throw err
    }
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
            doctorRepo.updateByAdmin(id, data)
            const doctor = doctorRepo.findById(id)
            if (doctor) {
                if (data.full_name || data.phone) {
                    patientRepo.updateByUserId(doctor.user_id, {
                        full_name: data.full_name,
                        phone:     data.phone,
                    })
                }
                if (data.email) {
                    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(data.email, doctor.user_id)
                }
            }
        }

        if (table === 'patients') {
            const patient = adminRepo.getPatientRecord(id)
            if (patient) {
                if (data.full_name || data.phone) {
                    patientRepo.updateByUserId(patient.user_id, {
                        full_name: data.full_name,
                        phone:     data.phone,
                    })
                }
                if (data.email) {
                    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(data.email, patient.user_id)
                }
            }
        }

        if (table === 'appointments') {
            const current = appointmentRepo.findById(id)
            if (!current) {
                const err = new Error('Appointment not found')
                err.status = 404
                throw err
            }

            const movingSlot   = data.appointment_date !== undefined
                || data.appointment_time !== undefined
            const finalStatus  = data.status ?? current.status

            if (movingSlot && finalStatus !== 'Cancelled') {
                const newDate = data.appointment_date ?? current.appointment_date
                const newTime = data.appointment_time ?? current.appointment_time

                const conflict = appointmentRepo.findConflict(
                    current.doctor_id, newDate, newTime, id
                )
                if (conflict) {
                    const err = new Error('Этот слот уже занят другим визитом')
                    err.status = 409
                    throw err
                }
            }

            appointmentRepo.update(id, data)
        }
    })

    execute()
}

function deleteRecord(table, id) {
    assertTable(table)

    if (table === 'doctors') {
        const appCount = db.prepare(
            `SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?`
        ).get(id).count
        if (appCount > 0) {
            const err = new Error(
                `Нельзя удалить врача — у него ${appCount} записей в истории. ` +
                `Удалите или перенесите визиты сначала.`
            )
            err.status = 409
            throw err
        }

        const doctor = db.prepare(`SELECT user_id FROM doctors WHERE id = ?`).get(id)
        if (!doctor) {
            const err = new Error('Doctor not found')
            err.status = 404
            throw err
        }

        const execute = db.transaction(() => {
            db.prepare(`DELETE FROM doctors  WHERE id = ?`).run(id)
            db.prepare(`DELETE FROM patients WHERE user_id = ?`).run(doctor.user_id)
            db.prepare(`DELETE FROM users    WHERE id = ?`).run(doctor.user_id)
        })
        execute()
        return
    }

    if (table === 'patients') {
        const appCount = db.prepare(
            `SELECT COUNT(*) as count FROM appointments WHERE patient_id = ?`
        ).get(id).count
        if (appCount > 0) {
            const err = new Error(
                `Нельзя удалить пациента — у него ${appCount} записей в истории. ` +
                `Удалите или перенесите визиты сначала.`
            )
            err.status = 409
            throw err
        }

        const patient = db.prepare(`SELECT user_id FROM patients WHERE id = ?`).get(id)
        if (!patient) {
            const err = new Error('Patient not found')
            err.status = 404
            throw err
        }

        // Защита: нельзя удалить пациента, чей user_id связан с врачом
        // (иначе осиротеет запись в doctors)
        const linkedDoctor = db.prepare(
            `SELECT id FROM doctors WHERE user_id = ?`
        ).get(patient.user_id)
        if (linkedDoctor) {
            const err = new Error(
                'Эта запись пациента связана с врачом. Удалите врача через раздел "Врачи".'
            )
            err.status = 409
            throw err
        }

        // Защита: нельзя удалить пациента-админа
        const user = db.prepare(`SELECT role FROM users WHERE id = ?`).get(patient.user_id)
        if (user?.role === 'admin') {
            const err = new Error('Нельзя удалить системного администратора')
            err.status = 409
            throw err
        }

        const execute = db.transaction(() => {
            db.prepare(`DELETE FROM patients WHERE id = ?`).run(id)
            db.prepare(`DELETE FROM users    WHERE id = ?`).run(patient.user_id)
        })
        execute()
        return
    }

    if (table === 'appointments') {
        const result = db.prepare(`DELETE FROM appointments WHERE id = ?`).run(id)
        if (result.changes === 0) {
            const err = new Error('Appointment not found')
            err.status = 404
            throw err
        }
        return
    }
}

module.exports = { getStats, getRecentActivity, getList, getRecord, updateRecord, deleteRecord }
