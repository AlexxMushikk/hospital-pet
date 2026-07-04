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
