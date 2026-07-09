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
            <div className="container profile-loading">
                <div className="profile-grid">
                    <div className="skeleton skeleton--profile" />
                    <div className="skeleton skeleton--profile" />
                </div>
            </div>
        )
    }

    if (!doctor) return null

    return (
        <main className="container profile-page">
            <div className="profile-grid">

                <aside className="profile-sidebar">
                    <div className="profile-photo">
                        <DoctorAvatar name={doctor.name} imageUrl={doctor.image_url} size={48} />
                    </div>

                    <h2 className="profile-name">{doctor.name}</h2>
                    <p className="profile-spec">{doctor.specialization}</p>
                    <div className="price-tag">{doctor.price} PLN</div>

                    <button
                        className="btn btn-solid w-full profile-book-btn"
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
                        <ul className="plain-list">
                            <li>
                                Образование:{' '}
                                {doctor.education
                                    ? doctor.education
                                    : <span className="text-placeholder">не указано</span>
                                }
                            </li>
                            <li>
                                Опыт:{' '}
                                {formatExperience(doctor.experience)
                                    ?? <span className="text-placeholder">не указан</span>
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
                                : <span className="text-placeholder">не указано</span>
                            }
                        </p>
                        <p><strong>Рабочие часы:</strong> {doctor.work_start} — {doctor.work_end}</p>
                        <p>
                            <strong>Стоимость визита:</strong>{' '}
                            <span className="price-inline">{doctor.price} PLN</span>
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
