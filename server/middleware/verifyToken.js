const { verifyAccessToken } = require('../services/jwtService')

function verifyToken(role = null) {
    return (req, res, next) => {
        // Читаем токен из заголовка Authorization: Bearer <token>
        const authHeader = req.headers['authorization']
        const token      = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({ error: 'Access token required' })
        }

        try {
            // Верифицируем подпись и срок действия.
            // Если токен истёк — jwt.verify бросает TokenExpiredError.
            // Фронт поймает 401 и сделает refresh.
            const decoded = verifyAccessToken(token)

            // Проверяем роль если нужно
            if (role && decoded.role !== role) {
                return res.status(403).json({ error: 'Access denied' })
            }

            // Кладём данные пользователя в req — доступны в роутах и сервисах
            req.user = decoded
            next()
        } catch (err) {
            // TokenExpiredError → 401 (фронт будет делать refresh)
            // JsonWebTokenError → 403 (невалидный токен)
            const status = err.name === 'TokenExpiredError' ? 401 : 403
            return res.status(status).json({ error: 'Invalid or expired token' })
        }
    }
}

module.exports = verifyToken