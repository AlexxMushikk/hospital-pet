import i18n from '../i18n'

export function formatExperience(experience) {
    if (!experience) return null
    const { years, months } = experience

    if (years === 0 && months === 0) return i18n.t('experience.lessThanMonth')

    const parts = []
    if (years > 0)  parts.push(i18n.t('experience.years',  { count: years }))
    if (months > 0) parts.push(i18n.t('experience.months', { count: months }))

    return parts.join(' ')
}

export function formatExperienceShort(experience) {
    if (!experience) return null
    const { years } = experience
    if (years === 0) return i18n.t('experience.lessThanYear')
    return i18n.t('experience.years', { count: years })
}
