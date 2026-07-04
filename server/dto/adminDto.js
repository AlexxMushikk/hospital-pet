const { z } = require('zod')

const { emailField, nameField, dateField, timeField, specializationField } = require('./fields')

const paginationDto = z.object({
    page:  z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
})

const updateDoctorByAdminDto = z.object({
    specialization:    specializationField.optional(),

    career_start_date: dateField.optional(),
    education:         z.string().optional(),
    bio:               z.string().max(1000).optional(),
    price:             z.coerce.number().int().min(0).optional(),
    languages:         z.string().optional(),
    image_url:         z.string().optional(),
    work_start:        timeField.optional(),
    work_end:          timeField.optional(),
    gender:            z.enum(['Male', 'Female', 'Not Specified']).optional(),

    full_name:         nameField.optional(),
    phone:             z.string().optional(),
    email:             emailField.optional(),
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Укажите хотя бы одно поле для обновления' }
).refine(
    data => {
        if (data.work_start && data.work_end) {
            return data.work_start < data.work_end
        }
        return true
    },
    { message: 'Начало смены должно быть раньше конца', path: ['work_end'] }
)

const updatePatientByAdminDto = z.object({
    full_name: nameField.optional(),
    phone:     z.string().optional(),
    email:     emailField.optional(),
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Укажите хотя бы одно поле для обновления' }
)

const updateAppointmentByAdminDto = z.object({
    appointment_date: dateField.optional(),
    appointment_time: timeField.optional(),
    status:           z.enum(['Scheduled', 'Completed', 'Cancelled']).optional(),
    symptoms:         z.string().max(250).optional(),
    doctor_notes:     z.string().optional(),
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Укажите хотя бы одно поле для обновления' }
)

module.exports = {
    paginationDto,
    updateDoctorByAdminDto,
    updatePatientByAdminDto,
    updateAppointmentByAdminDto,
}
