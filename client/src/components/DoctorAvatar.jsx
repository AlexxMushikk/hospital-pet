export default function DoctorAvatar({ name, imageUrl, size = 28 }) {
    const borderRadius = Math.round(size / 3.5)

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name || ''}
                style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    borderRadius: `${borderRadius}px`,
                }}
            />
        )
    }

    const initials = (name || '?')
        .split(' ')
        .slice(0, 2)
        .map(w => w[0] || '')
        .join('')
        .toUpperCase() || '?'

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
