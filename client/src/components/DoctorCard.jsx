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
                {doctor.image_url
                    ? <img src={doctor.image_url} alt={doctor.name}
                           style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    : <DoctorAvatar name={doctor.name}/>
                }
            </div>

            <div className="doctor-info">
                <div>
                    <span className="doctor-name">{doctor.name}</span>
                    <span style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                        {doctor.specialization}
                    </span>

                    {/* Цена — главный критерий выбора, показываем prominently */}
                    <span style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
                        {doctor.price} PLN
                    </span>

                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                        {doctor.experience
                            ? `${formatExperienceShort(doctor.experience)} опыта`
                            : 'Опыт не указан'} · {doctor.gender === 'Male' ? 'М' : doctor.gender === 'Female' ? 'Ж' : '—'}
                    </span>
                </div>

                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
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
