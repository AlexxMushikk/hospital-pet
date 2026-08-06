const { z } = require('zod')

const { dateField, timeField } = require('./fields')
const { SYMPTOMS_MAX_LENGTH } = require('../constants')

const createAppointmentDto = z.object({
    doctor_id:        z.number().int().positive(),
    appointment_date: dateField,
    appointment_time: timeField,
    symptoms:         z.string().max(SYMPTOMS_MAX_LENGTH).optional(),
})

const updateAppointmentDto = z.object({
    symptoms:     z.string().max(SYMPTOMS_MAX_LENGTH).optional(),
    status:       z.enum(['Scheduled', 'Completed', 'Cancelled']).optional(),
    doctor_notes: z.string().optional(),
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Укажите хотя бы одно поле для обновления' }
)

module.exports = { createAppointmentDto, updateAppointmentDto }
