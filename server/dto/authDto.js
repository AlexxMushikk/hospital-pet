const { z } = require('zod')

const loginDto = z.object({
    email:    z.string().email('Введите корректный email'),
    password: z.string().min(4, 'Пароль минимум 4 символа'),
})

const registerDto = z.object({
    email:     z.string().email('Введите корректный email'),
    password:  z.string().min(4, 'Пароль минимум 4 символа'),
    full_name: z.string().min(2, 'Имя минимум 2 символа'),
})

const updateViewDto = z.object({
    last_view: z.enum(['patient', 'doctor']),
})

module.exports = { loginDto, registerDto, updateViewDto }
