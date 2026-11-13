import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getDoctor, updateDoctor } from '../../api/index'
import Modal from '../../components/modal/Modal'
import { useModal } from '../../hooks/useModal'
import { apiErrorMessage } from '../../utils/apiError'

export default function DoctorEditProfile() {
    const navigate  = useNavigate()
    const { user }  = useAuth()
    const doctorId  = user?.doctor_id
    const { modal, showModal, closeModal } = useModal()
    const { t } = useTranslation()

    const [doctor,   setDoctor]   = useState(null)
    const [imageUrl, setImageUrl] = useState('')
    const [langs,    setLangs]    = useState('')
    const [edu,      setEdu]      = useState('')
    const [bio,      setBio]      = useState('')
    const [saving,   setSaving]   = useState(false)

    useEffect(() => {
        if (!doctorId) return
        const fetchDoctor = async () => {
            try {
                const res = await getDoctor(doctorId)
                const doc = res.data
                setDoctor(doc)
                setImageUrl(doc.image_url  || '')
                setLangs(doc.languages     || '')
                setEdu(doc.education       || '')
                setBio(doc.bio             || '')
            } catch {
                showModal(t('common.error'), t('doctorSettings.loadError'))
            }
        }
        fetchDoctor()
    }, [doctorId, showModal, t])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await updateDoctor(doctorId, { image_url: imageUrl, languages: langs, education: edu, bio })
            showModal(t('doctorSettings.savedTitle'), t('doctorSettings.savedText'), () => navigate('/doctor/schedule'))
        } catch (err) {
            showModal(t('common.error'), apiErrorMessage(err, 'doctorSettings.saveError'))
        } finally {
            setSaving(false)
        }
    }

    if (!doctor) {
        return (
            <main className="container">
                <div className="skeleton skeleton--profile skeleton--mt" />
            </main>
        )
    }

    return (
        <main className="container">
            <section className="page-title page-title--left">
                <h2>{t('doctorSettings.title')}</h2>
                <p>{t('doctorSettings.subtitle')}</p>
            </section>

            <div className="auth-card profile-form-card">
                <form onSubmit={handleSubmit}>

                    <div className="info-section">
                        <h3 className="section-heading">
                            <span className="text-danger">🗓</span>
                            {t('doctorSettings.workingHours')}
                        </h3>
                        <div className="form-grid-2 form-grid-2--mt">
                            <div className="form-group">
                                <span className="field-label-sm">{t('doctorSettings.shiftStart')}</span>
                                <div className="static-time-display">
                                    <span className="icon">🕒</span>
                                    <span>{doctor.work_start || '--:--'}</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <span className="field-label-sm">{t('doctorSettings.shiftEnd')}</span>
                                <div className="static-time-display">
                                    <span className="icon">⌛</span>
                                    <span>{doctor.work_end || '--:--'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="form-divider" />

                    <div className="info-section">
                        <h3>{t('doctorSettings.publicInfo')}</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>{t('common.photoUrl')}</label>
                                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="/assets/img/doctor.jpg" />
                            </div>
                            <div className="form-group">
                                <label>{t('doctorSettings.priceReadonly')}</label>
                                <input type="text" value={t('doctorSettings.priceValue', { price: doctor.price || 0 })} disabled className="input-readonly" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('common.languages')}</label>
                            <input type="text" value={langs} onChange={e => setLangs(e.target.value)} placeholder="English, Polish, German..." />
                        </div>

                        <div className="form-group">
                            <label>{t('doctorSettings.educationLabel')}</label>
                            <textarea value={edu} onChange={e => setEdu(e.target.value)} placeholder={t('doctorSettings.educationPlaceholder')} className="textarea-sm" />
                        </div>

                        <div className="form-group">
                            <label>{t('doctorSettings.bioLabel')}</label>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={t('doctorSettings.bioPlaceholder')} className="textarea-lg" />
                        </div>
                    </div>

                    <div className="form-actions form-actions--end">
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/doctor/schedule')}>{t('common.cancel')}</button>
                        <button type="submit" className="btn btn-solid" disabled={saving}>
                            {saving ? t('common.saving') : t('doctorSettings.submit')}
                        </button>
                    </div>
                </form>
            </div>

            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={closeModal} />
        </main>
    )
}
