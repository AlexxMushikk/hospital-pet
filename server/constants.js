const SLOT_STEP_MINUTES = 30

// Appointment dates and times are wall-clock values of the clinic, not of the server.
const CLINIC_TIMEZONE = process.env.CLINIC_TIMEZONE || 'Europe/Warsaw'

const BCRYPT_ROUNDS = 10

const REFRESH_TOKEN_DAYS = 7

// How long a just-replaced refresh token is still accepted (concurrent refresh from another tab).
const REFRESH_REUSE_GRACE_SECONDS = 30

const PASSWORD_MIN_LENGTH = 4
const NAME_MIN_LENGTH     = 2

const SYMPTOMS_MAX_LENGTH = 250
const BIO_MAX_LENGTH      = 1000

module.exports = {
    SLOT_STEP_MINUTES,
    CLINIC_TIMEZONE,
    BCRYPT_ROUNDS,
    REFRESH_TOKEN_DAYS,
    REFRESH_REUSE_GRACE_SECONDS,
    PASSWORD_MIN_LENGTH,
    NAME_MIN_LENGTH,
    SYMPTOMS_MAX_LENGTH,
    BIO_MAX_LENGTH,
}
