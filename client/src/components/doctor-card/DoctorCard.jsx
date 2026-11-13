import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { formatExperienceShort } from '../../utils/experience'
import DoctorAvatar from '../doctor-avatar/DoctorAvatar'
import StableText from '../stable-text/StableText'
import '../../styles/buttons.css'
import '../../styles/cards.css'
import './DoctorCard.css'

export default function DoctorCard({ doctor, onBookClick }) {
    const navigate  = useNavigate()
    const { user }  = useAuth()
    const { t }     = useTranslation()

    const genderShort = { Male: t('gender.shortMale'), Female: t('gender.shortFemale') }

    return (
        <div className="doctor-card">
            <div className="doctor-photo-box">
                <DoctorAvatar name={doctor.name} imageUrl={doctor.image_url} />
            </div>

            <div className="doctor-info">
                <div>
                    <span className="doctor-name">{doctor.name}</span>
                    <span className="doctor-card__spec">{t(`spec.${doctor.specialization}.label`, { defaultValue: doctor.specialization })}</span>

                    <span className="doctor-card__price">{doctor.price} PLN</span>

                    <span className="doctor-card__meta">
                        {doctor.experience
                            ? t('doctorCard.experience', { value: formatExperienceShort(doctor.experience) })
                            : t('doctorCard.experienceUnknown')} · {genderShort[doctor.gender] ?? t('gender.shortUnknown')}
                    </span>
                </div>

                <div className="doctor-card__actions">
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                    >
                        <StableText k="common.details" />
                    </button>
                    {user?.role !== 'doctor' && (
                        <button
                            className="btn btn-solid btn-sm"
                            onClick={() => onBookClick(doctor)}
                        >
                            <StableText k="doctorCard.book" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
