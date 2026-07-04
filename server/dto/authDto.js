const { z } = require('zod')

const { emailField, passwordField, nameField } = require('./fields')

const loginDto = z.object({
    email:    emailField,
    password: passwordField,
})

const registerDto = z.object({
    email:     emailField,
    password:  passwordField,
    full_name: nameField,
})

const updateViewDto = z.object({
    last_view: z.enum(['patient', 'doctor']),
})

module.exports = { loginDto, registerDto, updateViewDto }
