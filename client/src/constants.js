export const DOCTORS_PER_PAGE = 6

// Values match the server; the label and description live under "spec.<value>" in the i18n catalogs.
export const SPECIALIZATIONS = [
    { value: 'Cardiology',          icon: '🫀' },
    { value: 'Neurology',           icon: '🧠' },
    { value: 'Diagnostics',         icon: '🔬' },
    { value: 'Surgery',             icon: '🏥' },
    { value: 'Pediatrics',          icon: '👶' },
    { value: 'General Examination', icon: '🩺' },
]

export const VALIDATION = {
    PASSWORD_MIN: 4,
    NAME_MIN: 2,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    SYMPTOMS_MAX: 250,
}

export const SLOT_STEP_MINUTES = 30

export const TIME_OPTIONS = (() => {
    const out = []
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += SLOT_STEP_MINUTES) {
            out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
        }
    }
    return out
})()
