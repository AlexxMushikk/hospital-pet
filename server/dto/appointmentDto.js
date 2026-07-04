const { z } = require('zod')

const { dateField, timeField } = require('./fields')

const createAppointmentDto = z.object({
    doctor_id:        z.number().int().positive(),
    appointment_date: dateField,
    appointment_time: timeField,
    symptoms:         z.string().max(250).optional(),
})

const updateAppointmentDto = z.object({
    symptoms:     z.string().max(250).optional(),
    status:       z.enum(['Scheduled', 'Completed', 'Cancelled']).optional(),
    doctor_notes: z.string().optional(),
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Укажите хотя бы одно поле для обновления' }
)

module.exports = { createAppointmentDto, updateAppointmentDto }
