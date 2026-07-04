const { verifyAccessToken } = require('../services/jwtService')

function verifyToken(role = null) {
    return (req, res, next) => {
        const authHeader = req.headers['authorization']
        const token      = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({ error: 'Access token required' })
        }

        try {
            const decoded = verifyAccessToken(token)

            if (role && decoded.role !== role) {
                return res.status(403).json({ error: 'Access denied' })
            }

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