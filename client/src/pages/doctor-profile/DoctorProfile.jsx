import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getDoctor } from '../../api/index'
import Modal from '../../components/modal/Modal'
import { useModal } from '../../hooks/useModal'
import { formatExperience } from '../../utils/experience'
import DoctorAvatar from '../../components/doctor-avatar/DoctorAvatar'
import { ArrowLeft } from 'lucide-react'
import '../../styles/buttons.css'
import '../../styles/layout.css'
import '../../styles/skeleton.css'
import './DoctorProfile.css'

export default function DoctorProfile() {
    const { id }   = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { t } = useTranslation()
    const { modal, showModal, closeModal } = useModal()

    const [doctor,  setDoctor]  = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const res = await getDoctor(id)
                setDoctor(res.data)
            } catch {
                showModal(t('common.error'), t('doctorProfile.loadError'), () => navigate('/doctors'))
            } finally {
                setLoading(false)
            }
        }
        fetchDoctor()
    }, [id, showModal, navigate, t])

    const handleBookClick = () => {
        if (!user) {
            showModal(
                t('auth.authRequiredTitle'),
                t('auth.authRequiredText'),
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
                    <p className="profile-spec">{t(`spec.${doctor.specialization}.label`, { defaultValue: doctor.specialization })}</p>
                    <div className="price-tag">{doctor.price} PLN</div>

                    <button
                        className="btn btn-solid w-full profile-book-btn"
                        onClick={handleBookClick}
                    >
                        {t('doctorProfile.book')}
                    </button>

                    {/* navigate(-1) goes back in browser history, so /doctors filters are preserved */}
                    <button
                        className="btn btn-outline w-full"
                        onClick={() => navigate(-1)}
                    >
                        <span className="with-icon">
                            <ArrowLeft size={16} aria-hidden="true" />
                            {t('common.back')}
                        </span>
                    </button>
                </aside>

                <section className="profile-main">
                    {doctor.bio && (
                        <div className="info-section">
                            <h3>{t('doctorProfile.about')}</h3>
                            <p>{doctor.bio}</p>
                        </div>
                    )}

                    <div className="info-section">
                        <h3>{t('doctorProfile.educationAndExperience')}</h3>
                        <ul className="plain-list">
                            <li>
                                {t('doctorProfile.education')}{' '}
                                {doctor.education
                                    ? doctor.education
                                    : <span className="text-placeholder">{t('common.notSpecified')}</span>
                                }
                            </li>
                            <li>
                                {t('doctorProfile.experience')}{' '}
                                {formatExperience(doctor.experience)
                                    ?? <span className="text-placeholder">{t('common.notSpecified')}</span>
                                }
                            </li>
                        </ul>
                    </div>

                    <div className="info-section">
                        <h3>{t('doctorProfile.additionalInfo')}</h3>
                        <p>
                            <strong>{t('doctorProfile.languages')}</strong>{' '}
                            {doctor.languages
                                ? doctor.languages
                                : <span className="text-placeholder">{t('common.notSpecified')}</span>
                            }
                        </p>
                        <p><strong>{t('doctorProfile.workingHours')}</strong> {doctor.work_start} — {doctor.work_end}</p>
                        <p>
                            <strong>{t('doctorProfile.visitPrice')}</strong>{' '}
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
