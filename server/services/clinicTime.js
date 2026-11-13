const { CLINIC_TIMEZONE } = require('../constants')

const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
    hourCycle: 'h23',
})

// Current clinic wall-clock time as 'YYYY-MM-DD HH:MM', whatever zone the server runs in.
function clinicNow() {
    const p = Object.fromEntries(formatter.formatToParts(new Date()).map(part => [part.type, part.value]))
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

// Both values are zero-padded, so plain string comparison orders them correctly.
const isPast = (date, time) => `${date} ${time}` < clinicNow()

module.exports = { clinicNow, isPast }
