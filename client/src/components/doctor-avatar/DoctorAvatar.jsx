import { getInitials } from '../../utils/initials'
import './DoctorAvatar.css'

export default function DoctorAvatar({ name, imageUrl, size = 28 }) {
    const large = size >= 40

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name || ''}
                className={large ? 'doctor-avatar-img doctor-avatar-img--lg' : 'doctor-avatar-img'}
            />
        )
    }

    const initials = getInitials(name)

    return (
        <div className={large ? 'doctor-avatar doctor-avatar--lg' : 'doctor-avatar'}>
            {initials}
        </div>
    )
}
