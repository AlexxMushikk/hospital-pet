const { z } = require('zod')

const paginationDto = z.object({
    page:  z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
})

const updateDoctorByAdminDto = z.object({
    specialization:    z.string().min(1).optional(),

    career_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    education:         z.string().optional(),
    bio:               z.string().max(1000).optional(),
    price:             z.coerce.number().int().min(0).optional(),
    languages:         z.string().optional(),
    image_url:         z.string().optional(),
    work_start:        z.string().regex(/^\d{2}:\d{2}$/).optional(),
    work_end:          z.string().regex(/^\d{2}:\d{2}$/).optional(),
    gender:            z.enum(['Male', 'Female', 'Not Specified']).optional(),

    full_name:         z.string().min(2).optional(),
    phone:             z.string().optional(),
    email:             z.string().email().optional(),
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
    full_name: z.string().min(2).optional(),
    phone:     z.string().optional(),
    email:     z.string().email().optional(),
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Укажите хотя бы одно поле для обновления' }
)

const updateAppointmentByAdminDto = z.object({
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    appointment_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
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
