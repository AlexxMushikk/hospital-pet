const { z } = require('zod')

const { emailField, passwordField, nameField, dateField, specializationField } = require('./fields')
const { BIO_MAX_LENGTH } = require('../constants')

const doctorQueryDto = z.object({
    page:           z.coerce.number().int().min(1).default(1),
    limit:          z.coerce.number().int().min(1).max(20).default(6),
    specialization: z.string().optional(),
    gender:         z.enum(['Male', 'Female']).optional(),
    name:           z.string().optional(),

    minExperience:  z.coerce.number().int().min(0).default(0),

    sort: z.enum(['name_asc', 'price_asc', 'price_desc', 'exp_desc']).default('name_asc'),

    minPrice:       z.coerce.number().int().min(0).optional(),
    maxPrice:       z.coerce.number().int().min(0).optional(),

    excludeDoctorId: z.coerce.number().int().positive().optional(),
})

const updateDoctorDto = z.object({
    bio:       z.string().max(BIO_MAX_LENGTH, `Bio максимум ${BIO_MAX_LENGTH} символов`).optional(),
    education: z.string().optional(),
    languages: z.string().optional(),
    image_url: z.string().optional(),
})

const createDoctorDto = z.object({
    email:             emailField,
    password:          passwordField,
    full_name:         nameField,
    specialization:    specializationField,
    gender:            z.enum(['Male', 'Female', 'Not Specified']).default('Not Specified'),
    career_start_date: dateField,
    price:             z.coerce.number().int().min(0).default(200),
})

module.exports = { doctorQueryDto, updateDoctorDto, createDoctorDto }
