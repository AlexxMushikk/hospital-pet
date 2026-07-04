import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDoctor, updateDoctor } from '../api/index'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'

export default function DoctorEditProfile() {
    const navigate  = useNavigate()
    const { user }  = useAuth()
    const doctorId  = user?.doctor_id
    const { modal, showModal, closeModal } = useModal()

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
                showModal('Ошибка', 'Не удалось загрузить данные профиля.')
            }
        }
        fetchDoctor()
    }, [doctorId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await updateDoctor(doctorId, { image_url: imageUrl, languages: langs, education: edu, bio })
            showModal('Сохранено!', 'Профиль успешно обновлён.', () => navigate('/doctor/schedule'))
        } catch {
            showModal('Ошибка', 'Не удалось сохранить изменения.')
        } finally {
            setSaving(false)
        }
    }

    if (!doctor) {
        return (
            <main className="container">
                <div className="skeleton" style={{ height: '400px', borderRadius: '16px', marginTop: '30px' }} />
            </main>
        )
    }

    return (
        <main className="container">
            <section className="page-title" style={{ textAlign: 'left' }}>
                <h2 style={{ fontWeight: 800 }}>Настройки профиля</h2>
                <p>Обновите публичную информацию о себе</p>
            </section>

            <div className="auth-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
                <form onSubmit={handleSubmit}>

                    <div className="info-section">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#dc2626' }}>🗓</span>
                            Рабочие часы (управляет администратор)
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                            <div className="form-group">
                                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8' }}>Начало смены</span>
                                <div className="static-time-display">
                                    <span className="icon">🕒</span>
                                    <span>{doctor.work_start || '--:--'}</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8' }}>Конец смены</span>
                                <div className="static-time-display">
                                    <span className="icon">⌛</span>
                                    <span>{doctor.work_end || '--:--'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr style={{ margin: '30px 0', border: 0, borderTop: '1px solid #eee' }} />

                    <div className="info-section">
                        <h3>👤 Публичная информация</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>URL фотографии</label>
                                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="/assets/img/doctor.jpg" />
                            </div>
                            <div className="form-group">
                                <label>Стоимость визита (только чтение)</label>
                                <input type="text" value={`${doctor.price || 0} PLN (управляет админ)`} disabled style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Языки</label>
                            <input type="text" value={langs} onChange={e => setLangs(e.target.value)} placeholder="English, Polish, German..." />
                        </div>

                        <div className="form-group">
                            <label>Образование и квалификации</label>
                            <textarea value={edu} onChange={e => setEdu(e.target.value)} placeholder="Ваши университеты и сертификаты..." style={{ minHeight: '80px' }} />
                        </div>

                        <div className="form-group">
                            <label>Профессиональная биография</label>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Расскажите пациентам о своём опыте..." style={{ minHeight: '120px' }} />
                        </div>
                    </div>

                    <div className="form-actions" style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: '15px' }}>
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/doctor/schedule')}>Отмена</button>
                        <button type="submit" className="btn btn-solid" disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить профиль'}
                        </button>
                    </div>
                </form>
            </div>

            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={closeModal} />
        </main>
    )
}
