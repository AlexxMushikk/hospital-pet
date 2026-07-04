import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDoctor } from '../api/index'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { formatExperience } from '../utils/experience'
import DoctorAvatar from '../components/DoctorAvatar'

export default function DoctorProfile() {
    const { id }   = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { modal, showModal, closeModal } = useModal()

    const [doctor,  setDoctor]  = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const res = await getDoctor(id)
                setDoctor(res.data)
            } catch {
                showModal('Ошибка', 'Не удалось загрузить профиль врача.', () => navigate('/doctors'))
            } finally {
                setLoading(false)
            }
        }
        fetchDoctor()
    }, [id, showModal, navigate])

    const handleBookClick = () => {
        if (!user) {
            showModal(
                'Требуется авторизация',
                'Войдите в систему чтобы записаться к врачу.',
                () => navigate('/login')
            )
        } else {
            navigate(`/booking?doctorId=${id}&name=${encodeURIComponent(doctor.name)}`)
        }
    }

    if (loading) {
        return (
            <div className="container" style={{ padding: '40px 0' }}>
                <div className="profile-grid">
                    <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
                    <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
                </div>
            </div>
        )
    }

    if (!doctor) return null

    return (
        <main className="container" style={{ padding: '30px 0' }}>
            <div className="profile-grid">

                <aside className="profile-sidebar">
                    <div className="profile-photo">
                        {doctor.image_url
                            ? <img src={doctor.image_url} alt={doctor.name}
                                   style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                            : <DoctorAvatar name={doctor.name} size={48} />
                        }
                    </div>

                    <h2 style={{ margin: '15px 0 5px' }}>{doctor.name}</h2>
                    <p style={{ color: '#6b7280', marginBottom: '10px' }}>{doctor.specialization}</p>
                    <div className="price-tag">{doctor.price} PLN</div>

                    <button
                        className="btn btn-solid w-full"
                        style={{ marginBottom: '10px' }}
                        onClick={handleBookClick}
                    >
                        Записаться
                    </button>

                    {/* navigate(-1) возвращает на предыдущую страницу браузера —
                        фильтры на /doctors сохраняются потому что это та же страница в истории */}
                    <button
                        className="btn btn-outline w-full"
                        onClick={() => navigate(-1)}
                    >
                        ← Назад
                    </button>
                </aside>

                <section className="profile-main">
                    {doctor.bio && (
                        <div className="info-section">
                            <h3>О враче</h3>
                            <p>{doctor.bio}</p>
                        </div>
                    )}

                    <div className="info-section">
                        <h3>Образование и опыт</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li>
                                Образование:{' '}
                                {doctor.education
                                    ? doctor.education
                                    : <span style={{ color: '#9ca3af' }}>не указано</span>
                                }
                            </li>
                            <li style={{ marginTop: '8px' }}>
                                Опыт:{' '}
                                {formatExperience(doctor.experience)
                                    ?? <span style={{ color: '#9ca3af' }}>не указан</span>
                                }
                            </li>
                        </ul>
                    </div>

                    <div className="info-section">
                        <h3>Дополнительная информация</h3>
                        <p>
                            <strong>Языки:</strong>{' '}
                            {doctor.languages
                                ? doctor.languages
                                : <span style={{ color: '#9ca3af' }}>не указано</span>
                            }
                        </p>
                        <p><strong>Рабочие часы:</strong> {doctor.work_start} — {doctor.work_end}</p>
                        <p>
                            <strong>Стоимость визита:</strong>{' '}
                            <span style={{ color: '#dc2626', fontWeight: 700 }}>{doctor.price} PLN</span>
                        </p>
                    </div>
                </section>
            </div>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
            />
        </main>
    )
}
