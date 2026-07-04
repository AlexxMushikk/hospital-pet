function pluralRu(n, forms) {

    const mod10  = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
    return forms[2]
}

export function formatExperience(experience) {
    if (!experience) return null
    const { years, months } = experience

    if (years === 0 && months === 0) return 'менее месяца'

    const parts = []
    if (years > 0)  parts.push(`${years} ${pluralRu(years,  ['год', 'года', 'лет'])}`)
    if (months > 0) parts.push(`${months} ${pluralRu(months, ['месяц', 'месяца', 'месяцев'])}`)

    return parts.join(' ')
}

export function formatExperienceShort(experience) {
    if (!experience) return null
    const { years } = experience
    if (years === 0) return 'менее года'
    return `${years} ${pluralRu(years, ['год', 'года', 'лет'])}`
}
