const { z } = require('zod')

const emailField          = z.string().email('Введите корректный email')
const passwordField       = z.string().min(4, 'Пароль минимум 4 символа')
const nameField           = z.string().min(2, 'Имя минимум 2 символа')

const isRealDate = (value) => {
    const [year, month, day] = value.split('-').map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))

    return parsed.getUTCFullYear() === year
        && parsed.getUTCMonth() === month - 1
        && parsed.getUTCDate() === day
}

const dateField           = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: YYYY-MM-DD')
    .refine(isRealDate, 'Такой даты не существует')

const timeField           = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Формат времени: HH:MM')

const specializationField = z.enum([
    'Cardiology', 'Neurology', 'Diagnostics',
    'Surgery', 'Pediatrics', 'General Examination',
])

module.exports = {
    emailField, passwordField, nameField, dateField, timeField, specializationField,
}
