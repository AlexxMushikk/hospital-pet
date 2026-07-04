export default function DoctorAvatar({ name, size = 28 }) {
    const initials = (name || '?')
        .split(' ')
        .slice(0, 2)
        .map(w => w[0] || '')
        .join('')
        .toUpperCase() || '?'

    const borderRadius = Math.round(size / 3.5)

    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            borderRadius: `${borderRadius}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            fontSize: `${size}px`,
            fontWeight: 700,
            letterSpacing: size <= 32 ? '2px' : 'normal',
        }}>
            {initials}
        </div>
    )
}
