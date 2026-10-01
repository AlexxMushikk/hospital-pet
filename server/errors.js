const MESSAGES = {
    // --- auth ---
    'errors.INVALID_CREDENTIALS':     'Invalid credentials',
    'errors.EMAIL_EXISTS':            'Email already exists',
    'errors.SESSION_REVOKED':         'Session revoked',

    'errors.ACCESS_TOKEN_REQUIRED':   'Access token required',
    'errors.REFRESH_TOKEN_REQUIRED':  'Refresh token required',
    'errors.INVALID_REFRESH_TOKEN':   'Invalid refresh token',
    'errors.INVALID_OR_EXPIRED_TOKEN':'Invalid or expired token',
    'errors.USER_NOT_FOUND':          'User not found',

    // --- access ---
    'errors.FORBIDDEN':               'Forbidden',
    'errors.ACCESS_DENIED':           'Access denied',
    'errors.PATIENTS_ONLY':           'Only patients can book appointments',
    'errors.STATUS_CHANGE_FORBIDDEN': 'Status change is not allowed for your role',
    'errors.ADMIN_DELETE_FORBIDDEN':  'The system administrator cannot be deleted',

    // --- booking ---
    'errors.SLOT_TAKEN':              'This slot is already booked',
    'errors.OUTSIDE_WORKING_HOURS':   'Time is outside the doctor working hours',
    'errors.SLOT_STEP':               'Appointments start every {{minutes}} minutes',
    'errors.INVALID_DATE_TIME':       'Invalid date or time',
    'errors.PAST_DATE':               'Cannot book a slot in the past',

    // --- not found ---
    'errors.NOT_FOUND':               'Not found',
    'errors.APPOINTMENT_NOT_FOUND':   'Appointment not found',
    'errors.DOCTOR_NOT_FOUND':        'Doctor not found',
    'errors.PATIENT_NOT_FOUND':       'Patient not found',

    // --- query ---
    'errors.DATE_REQUIRED':           'Date parameter is required',
    'errors.INVALID_TABLE':           'Invalid table',
    'errors.NO_EDITABLE_FIELDS':      'No editable fields provided',
    'errors.UNKNOWN_SPECIALIZATION':  'Unknown specialization',

    'errors.INTERNAL':                'Internal server error',

    // --- Validation (zod) ---
    'validation.nameMin':             'Name must be at least {{count}} characters',
    'validation.passwordMin':         'Password must be at least {{count}} characters',
    'validation.email':               'Enter a valid email address',
    'validation.symptomsMax':         'Symptom description is too long (max {{count}} characters)',
    'validation.bioMax':              'Biography is too long (max {{count}} characters)',
    'validation.dateFormat':          'Date format: YYYY-MM-DD',
    'validation.dateInvalid':         'This date does not exist',
    'validation.timeFormat':          'Time format: HH:MM',
    'validation.priceNegative':       'Price cannot be negative',
    'validation.shiftStartAfterEnd':  'Shift start must be earlier than shift end',
}

function interpolate(template, params) {
    if (!params) return template
    return template.replace(/\{\{(\w+)}}/g, (match, key) =>
        params[key] === undefined ? match : String(params[key])
    )
}

function buildError(code, status, params) {
    const template = MESSAGES[code]
    const err = new Error(interpolate(template ?? code, params))

    err.status = status
    err.code   = code
    if (params) err.params = params

    return err
}

function fail(code, status, params) {
    throw buildError(code, status, params)
}

module.exports = { MESSAGES, buildError, fail }
