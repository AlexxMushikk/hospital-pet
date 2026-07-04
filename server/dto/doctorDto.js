const { z } = require('zod')

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
})

const updateDoctorDto = z.object({
    bio:       z.string().max(1000, 'Bio максимум 1000 символов').optional(),
    education: z.string().optional(),
    languages: z.string().optional(),
    image_url: z.string().optional(),
})

const createDoctorDto = z.object({
    email:             z.string().email('Введите корректный email'),
    password:          z.string().min(4, 'Пароль минимум 4 символа'),
    full_name:         z.string().min(2, 'Имя минимум 2 символа'),
    specialization:    z.string().min(1, 'Укажите специализацию'),
    gender:            z.enum(['Male', 'Female', 'Not Specified']).default('Not Specified'),
    career_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: YYYY-MM-DD'),
    price:             z.coerce.number().int().min(0).default(200),
})

module.exports = { doctorQueryDto, updateDoctorDto, createDoctorDto }
