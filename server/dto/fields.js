const { z } = require('zod')

const emailField          = z.string().email('Введите корректный email')
const passwordField       = z.string().min(4, 'Пароль минимум 4 символа')
const nameField           = z.string().min(2, 'Имя минимум 2 символа')
const dateField           = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: YYYY-MM-DD')
const timeField           = z.string().regex(/^\d{2}:\d{2}$/, 'Формат времени: HH:MM')
const specializationField = z.enum([
    'Cardiology', 'Neurology', 'Diagnostics',
    'Surgery', 'Pediatrics', 'General Examination',
])

module.exports = {
    emailField, passwordField, nameField, dateField, timeField, specializationField,
}
