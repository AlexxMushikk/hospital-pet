import i18n from '../i18n'

const locale = () => i18n.resolvedLanguage || 'en'

// Returns today as YYYY-MM-DD in the local timezone.
// Plain toISOString() uses UTC and can return yesterday's date.
export const getTodayStr = () => {
    const now    = new Date()
    const offset = now.getTimezoneOffset() * 60000
    return new Date(now - offset).toISOString().split('T')[0]
}

// 'YYYY-MM-DD' alone is parsed as UTC midnight, which is the previous day west of Greenwich;
// adding a time makes it local.
const parseLocalDate = (dateStr) => new Date(`${dateStr}T00:00`)

export const formatDate = (dateStr) => {
    const d = parseLocalDate(dateStr)
    return isNaN(d) ? dateStr : d.toLocaleDateString(locale(), {
        year: 'numeric', month: 'long', day: 'numeric',
    })
}

export const formatDateTime = (dateStr, time) => {
    const d = new Date(`${dateStr}T${time}`)
    return isNaN(d)
        ? `${dateStr} | ${time}`
        : d.toLocaleString(locale(), {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
}
