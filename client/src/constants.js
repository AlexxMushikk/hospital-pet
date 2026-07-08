export const DOCTORS_PER_PAGE = 6

export const SPECIALIZATIONS = [
    { value: 'Cardiology',          label: 'Кардиология',  icon: '🫀', desc: 'Диагностика и лечение сердечно-сосудистых заболеваний' },
    { value: 'Neurology',           label: 'Неврология',   icon: '🧠', desc: 'Лечение заболеваний нервной системы' },
    { value: 'Diagnostics',         label: 'Диагностика',  icon: '🔬', desc: 'Комплексное обследование и постановка диагноза' },
    { value: 'Surgery',             label: 'Хирургия',     icon: '🏥', desc: 'Плановые и экстренные хирургические вмешательства' },
    { value: 'Pediatrics',          label: 'Педиатрия',    icon: '👶', desc: 'Медицинская помощь детям всех возрастов' },
    { value: 'General Examination', label: 'Общий осмотр', icon: '🩺', desc: 'Профилактические осмотры и общая медицина' },
]

export const VALIDATION = {
    PASSWORD_MIN: 4,
    NAME_MIN: 2,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
