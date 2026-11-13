// Returns today as YYYY-MM-DD in the local timezone.
// Plain toISOString() uses UTC and can return yesterday's date.
export const getTodayStr = () => {
    const now    = new Date()
    const offset = now.getTimezoneOffset() * 60000
    return new Date(now - offset).toISOString().split('T')[0]
}

export const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return isNaN(d) ? dateStr : d.toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric'
    })
}

export const formatDateTime = (dateStr, time) => {
    const d = new Date(`${dateStr}T${time}`)
    return isNaN(d)
        ? `${dateStr} | ${time}`
        : d.toLocaleString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
}
