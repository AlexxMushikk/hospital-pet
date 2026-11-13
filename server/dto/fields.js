const { z } = require('zod')

const { PASSWORD_MIN_LENGTH, NAME_MIN_LENGTH } = require('../constants')

const emailField          = z.string().email('validation.email')
const passwordField       = z.string().min(PASSWORD_MIN_LENGTH, 'validation.passwordMin')
const nameField           = z.string().min(NAME_MIN_LENGTH, 'validation.nameMin')

const isRealDate = (value) => {
    const [year, month, day] = value.split('-').map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))

    return parsed.getUTCFullYear() === year
        && parsed.getUTCMonth() === month - 1
        && parsed.getUTCDate() === day
}

const dateField           = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.dateFormat')
    .refine(isRealDate, 'validation.dateInvalid')

const timeField           = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'validation.timeFormat')

const specializationField = z.enum([
    'Cardiology', 'Neurology', 'Diagnostics',
    'Surgery', 'Pediatrics', 'General Examination',
])

module.exports = {
    emailField, passwordField, nameField, dateField, timeField, specializationField,
}
