// src/utils/date.js

// Возвращает сегодняшнюю дату в формате YYYY-MM-DD с учётом таймзоны.
// Без offset браузер может вернуть вчерашнюю дату в UTC.
export const getTodayStr = () => {
    const now    = new Date()
    const offset = now.getTimezoneOffset() * 60000
    return new Date(now - offset).toISOString().split('T')[0]
}

// Форматирует дату из YYYY-MM-DD в читаемый вид: "15 января 2024"
export const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return isNaN(d) ? dateStr : d.toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric'
    })
}

// Форматирует дату + время для AppointmentDetails
export const formatDateTime = (dateStr, time) => {
    const d = new Date(`${dateStr}T${time}`)
    return isNaN(d)
        ? `${dateStr} | ${time}`
        : d.toLocaleString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
}
