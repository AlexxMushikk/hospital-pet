import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAppointment, updateAppointment } from '../api/index'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { statusLabel, statusClass } from '../utils/status'
import { formatDateTime } from '../utils/date'

export default function AppointmentDetails() {
    const { id }   = useParams()
    const navigate = useNavigate()
    const { user, view } = useAuth()
    const { modal, showModal, closeModal } = useModal()

    const [app,          setApp]          = useState(null)
    const [symptoms,     setSymptoms]     = useState('')
    const [doctorNotes,  setDoctorNotes]  = useState('')
    const [notesEditing, setNotesEditing] = useState(false)
    const [loading,      setLoading]      = useState(true)
    const [saving,       setSaving]       = useState(false)

    useEffect(() => {
        const fetchAppointment = async () => {
            setLoading(true)
            try {
                const res = await getAppointment(id)
                setApp(res.data)
                setSymptoms(res.data.symptoms      || '')
                setDoctorNotes(res.data.doctor_notes || '')
            } catch {
                showModal('Ошибка', 'Не удалось загрузить данные визита.', () => navigate('/appointments'))
            } finally {
                setLoading(false)
            }
        }
        fetchAppointment()
    }, [id, navigate, showModal])

    const handleFinish = async () => {
        if (!doctorNotes.trim()) {
            showModal('Обязательное поле', 'Заполните медицинские заметки перед завершением визита.')
            return
        }
        setSaving(true)
        try {
            await updateAppointment(id, { doctor_notes: doctorNotes, status: 'Completed' })
            showModal('Готово', 'Визит отмечен как завершённый.', () => navigate('/doctor/schedule'))
        } catch {
            showModal('Ошибка', 'Не удалось завершить визит.')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        showModal(
            'Подтверждение',
            'Вы уверены что хотите отменить этот визит?',
            async () => {
                try {
                    await updateAppointment(id, { status: 'Cancelled' })
                    setApp(prev => ({ ...prev, status: 'Cancelled' }))
                } catch {
                    showModal('Ошибка', 'Не удалось отменить визит.')
                }
            },
            'Отмена',
            'danger'
        )
    }

    const handleSaveSymptoms = async () => {
        if (symptoms.length > 250) {
            showModal('Ошибка', 'Описание симптомов слишком длинное (макс. 250 символов).')
            return
        }
        setSaving(true)
        try {
            await updateAppointment(id, { symptoms })
            showModal('Сохранено', 'Симптомы успешно обновлены.')
        } catch {
            showModal('Ошибка', 'Не удалось сохранить симптомы.')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveNotes = async () => {
        if (!doctorNotes.trim()) {
            showModal('Ошибка', 'Заметки не могут быть пустыми.')
            return
        }
        setSaving(true)
        try {
            await updateAppointment(id, { doctor_notes: doctorNotes })
            showModal('Сохранено', 'Медицинские заметки обновлены.')
            setNotesEditing(false)
        } catch {
            showModal('Ошибка', 'Не удалось сохранить заметки.')
        } finally {
            setSaving(false)
        }
    }

    const isDocView = user?.role === 'doctor' && view === 'doctor'

    if (loading) {
        return (
            <div className="auth-container">
                <div className="auth-card auth-card--wide">
                    <div className="skeleton skeleton--block" />
                </div>
            </div>
        )
    }

    if (!app) return null

    return (
        <div className="auth-container">
            <div className="auth-card auth-card--wide auth-card--left">

                <div className="appt-status-row">
                    <span className={statusClass(app.status)}>{statusLabel(app.status)}</span>
                </div>

                <div className="appt-header">
                    <div>
                        <h2 className="doctor-name">
                            {isDocView ? `Пациент: ${app.patient_name}` : app.doctor_name}
                        </h2>
                        <p className="appt-subtitle">
                            {isDocView ? 'Медицинская карта' : app.doctor_spec}
                        </p>
                        <p className="appt-datetime-lg">
                            {formatDateTime(app.appointment_date, app.appointment_time)}
                        </p>
                    </div>
                    <div className="hospital-logo-placeholder hospital-logo-placeholder--sm">+</div>
                </div>

                <hr className="divider" />

                <div className="form-group">
                    <label className="label-bold">Симптомы / Причина визита</label>
                    <textarea
                        value={symptoms}
                        onChange={e => setSymptoms(e.target.value)}
                        maxLength={250}
                        placeholder="Симптомы не указаны"
                        disabled={isDocView || app.status !== 'Scheduled'}
                        className="appt-textarea"
                    />
                    {!isDocView && app.status === 'Scheduled' && (
                        <div className={`char-counter ${symptoms.length > 220 ? 'char-counter--warn' : ''}`}>
                            {symptoms.length} / 250
                        </div>
                    )}
                </div>

                <div className="form-group form-group--spaced">
                    <label className="label-notes">Медицинские заметки врача</label>
                    <textarea
                        value={doctorNotes}
                        onChange={e => setDoctorNotes(e.target.value)}
                        disabled={!isDocView || (!notesEditing && app.status === 'Completed')}
                        placeholder={isDocView ? 'Введите медицинские заметки...' : 'Заметки врача появятся после визита'}
                        className="appt-textarea appt-textarea--notes"
                    />
                </div>

                <div className="form-actions form-actions--detail">

                    {isDocView && app.status === 'Scheduled' && (
                        <>
                            <button className="btn btn-solid" onClick={handleFinish} disabled={saving}>
                                {saving ? '...' : 'Завершить визит'}
                            </button>
                            <button className="btn btn-outline" onClick={handleCancel}>Отменить визит</button>
                            <button className="btn btn-outline" onClick={() => navigate('/doctor/schedule')}>Назад к расписанию</button>
                        </>
                    )}

                    {isDocView && app.status === 'Completed' && (
                        <>
                            {notesEditing
                                ? <button className="btn btn-solid" onClick={handleSaveNotes} disabled={saving}>{saving ? '...' : 'Сохранить заметки'}</button>
                                : <button className="btn btn-solid" onClick={() => setNotesEditing(true)}>Редактировать заметки</button>
                            }
                            <button className="btn btn-outline" onClick={() => navigate('/doctor/schedule')}>Назад к расписанию</button>
                        </>
                    )}

                    {isDocView && app.status === 'Cancelled' && (
                        <button className="btn btn-outline" onClick={() => navigate('/doctor/schedule')}>Назад</button>
                    )}

                    {!isDocView && app.status === 'Scheduled' && (
                        <>
                            <button className="btn btn-solid" onClick={handleSaveSymptoms} disabled={saving}>
                                {saving ? '...' : 'Сохранить симптомы'}
                            </button>
                            <button className="btn btn-outline" onClick={handleCancel}>Отменить визит</button>
                            <button className="btn btn-outline" onClick={() => navigate('/appointments')}>Назад к списку</button>
                        </>
                    )}

                    {!isDocView && app.status !== 'Scheduled' && (
                        <button className="btn btn-outline w-full" onClick={() => navigate('/appointments')}>Назад к моим визитам</button>
                    )}

                </div>
            </div>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
                cancelLabel={modal.cancelLabel}
                variant={modal.variant}
            />
        </div>
    )
}
