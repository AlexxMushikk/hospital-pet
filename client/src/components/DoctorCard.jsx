import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatExperienceShort } from '../utils/experience'
import DoctorAvatar from './DoctorAvatar'

export default function DoctorCard({ doctor, onBookClick }) {
    const navigate  = useNavigate()
    const { user }  = useAuth()

    return (
        <div className="doctor-card">
            <div className="doctor-photo-box">
                <DoctorAvatar name={doctor.name} imageUrl={doctor.image_url} />
            </div>

            <div className="doctor-info">
                <div>
                    <span className="doctor-name">{doctor.name}</span>
                    <span className="doctor-card__spec">{doctor.specialization}</span>

                    {/* Цена — главный критерий выбора, показываем prominently */}
                    <span className="doctor-card__price">{doctor.price} PLN</span>

                    <span className="doctor-card__meta">
                        {doctor.experience
                            ? `${formatExperienceShort(doctor.experience)} опыта`
                            : 'Опыт не указан'} · {doctor.gender === 'Male' ? 'М' : doctor.gender === 'Female' ? 'Ж' : '—'}
                    </span>
                </div>

                <div className="doctor-card__actions">
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                    >
                        Подробнее
                    </button>
                    {user?.role !== 'doctor' && (
                        <button
                            className="btn btn-solid btn-sm"
                            onClick={() => onBookClick(doctor)}
                        >
                            Записаться
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
