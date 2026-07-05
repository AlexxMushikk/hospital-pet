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

module.exports = { loginDto, registerDto }
