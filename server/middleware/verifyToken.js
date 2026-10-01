const { verifyAccessToken } = require('../services/jwtService')
const { buildError } = require('../errors')

function verifyToken(role = null) {
    return (req, res, next) => {
        const authHeader = req.headers['authorization']
        const token      = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return next(buildError('errors.ACCESS_TOKEN_REQUIRED', 401))
        }

        try {
            const decoded = verifyAccessToken(token)

            if (role && decoded.role !== role) {
                return next(buildError('errors.ACCESS_DENIED', 403))
            }

            req.user = decoded
            next()
        } catch (err) {
            const status = err.name === 'TokenExpiredError' ? 401 : 403
            return next(buildError('errors.INVALID_OR_EXPIRED_TOKEN', status))
        }
    }
}

module.exports = verifyToken
