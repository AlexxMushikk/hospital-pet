import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getAppointment, updateAppointment } from '../../api/index'
import Modal from '../../components/modal/Modal'
import { useModal } from '../../hooks/useModal'
import { statusLabel, statusClass } from '../../utils/status'
import { formatDateTime } from '../../utils/date'
import { VALIDATION } from '../../constants'
import { apiErrorMessage } from '../../utils/apiError'

export default function AppointmentDetails() {
    const { id }   = useParams()
    const navigate = useNavigate()
    const { user, view } = useAuth()
    const { modal, showModal, closeModal } = useModal()
    const { t } = useTranslation()

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
                showModal(t('common.error'), t('appointmentDetails.loadError'), () => navigate('/appointments'))
            } finally {
                setLoading(false)
            }
        }
        fetchAppointment()
    }, [id, navigate, showModal, t])

    const handleFinish = async () => {
        if (!doctorNotes.trim()) {
            showModal(t('appointmentDetails.notesRequiredTitle'), t('appointmentDetails.notesRequiredText'))
            return
        }
        setSaving(true)
        try {
            await updateAppointment(id, { doctor_notes: doctorNotes, status: 'Completed' })
            showModal(t('common.done'), t('appointmentDetails.completedText'), () => navigate('/doctor/schedule'))
        } catch (err) {
            showModal(t('common.error'), apiErrorMessage(err, 'appointmentDetails.completeError'))
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        showModal(
            t('common.confirmation'),
            t('appointmentDetails.cancelConfirmText'),
            async () => {
                try {
                    await updateAppointment(id, { status: 'Cancelled' })
                    setApp(prev => ({ ...prev, status: 'Cancelled' }))
                } catch (err) {
                    showModal(t('common.error'), apiErrorMessage(err, 'appointmentDetails.cancelError'))
                }
            },
            t('common.cancel'),
            'danger'
        )
    }

    const handleSaveSymptoms = async () => {
        if (symptoms.length > VALIDATION.SYMPTOMS_MAX) {
            showModal(t('common.error'), t('validation.symptomsMax', { count: VALIDATION.SYMPTOMS_MAX }))
            return
        }
        setSaving(true)
        try {
            await updateAppointment(id, { symptoms })
            showModal(t('common.saved'), t('appointmentDetails.symptomsSavedText'))
        } catch (err) {
            showModal(t('common.error'), apiErrorMessage(err, 'appointmentDetails.symptomsSaveError'))
        } finally {
            setSaving(false)
        }
    }

    const handleSaveNotes = async () => {
        if (!doctorNotes.trim()) {
            showModal(t('common.error'), t('appointmentDetails.notesEmpty'))
            return
        }
        setSaving(true)
        try {
            await updateAppointment(id, { doctor_notes: doctorNotes })
            showModal(t('common.saved'), t('appointmentDetails.notesSavedText'))
            setNotesEditing(false)
        } catch (err) {
            showModal(t('common.error'), apiErrorMessage(err, 'appointmentDetails.notesSaveError'))
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
                            {isDocView ? t('appointmentDetails.patientPrefix', { name: app.patient_name }) : app.doctor_name}
                        </h2>
                        <p className="appt-subtitle">
                            {isDocView ? t('appointmentDetails.medicalCard') : t(`spec.${app.doctor_spec}.label`, { defaultValue: app.doctor_spec })}
                        </p>
                        <p className="appt-datetime-lg">
                            {formatDateTime(app.appointment_date, app.appointment_time)}
                        </p>
                    </div>
                    <div className="hospital-logo-placeholder hospital-logo-placeholder--sm">+</div>
                </div>

                <hr className="divider" />

                <div className="form-group">
                    <label className="label-bold">{t('appointmentDetails.symptomsLabel')}</label>
                    <textarea
                        value={symptoms}
                        onChange={e => setSymptoms(e.target.value)}
                        maxLength={VALIDATION.SYMPTOMS_MAX}
                        placeholder={t('appointmentDetails.symptomsPlaceholder')}
                        disabled={isDocView || app.status !== 'Scheduled'}
                        className="appt-textarea"
                    />
                    {!isDocView && app.status === 'Scheduled' && (
                        <div className={`char-counter ${symptoms.length > 220 ? 'char-counter--warn' : ''}`}>
                            {symptoms.length} / {VALIDATION.SYMPTOMS_MAX}
                        </div>
                    )}
                </div>

                <div className="form-group form-group--spaced">
                    <label className="label-notes">{t('appointmentDetails.notesLabel')}</label>
                    <textarea
                        value={doctorNotes}
                        onChange={e => setDoctorNotes(e.target.value)}
                        disabled={!isDocView || (!notesEditing && app.status === 'Completed')}
                        placeholder={isDocView ? t('appointmentDetails.notesPlaceholderDoctor') : t('appointmentDetails.notesPlaceholderPatient')}
                        className="appt-textarea appt-textarea--notes"
                    />
                </div>

                <div className="form-actions form-actions--detail">

                    {isDocView && app.status === 'Scheduled' && (
                        <>
                            <button className="btn btn-solid" onClick={handleFinish} disabled={saving}>
                                {saving ? '...' : t('appointmentDetails.complete')}
                            </button>
                            <button className="btn btn-outline" onClick={handleCancel}>{t('appointmentDetails.cancelVisit')}</button>
                            <button className="btn btn-outline" onClick={() => navigate('/doctor/schedule')}>{t('appointmentDetails.backToSchedule')}</button>
                        </>
                    )}

                    {isDocView && app.status === 'Completed' && (
                        <>
                            {notesEditing
                                ? <button className="btn btn-solid" onClick={handleSaveNotes} disabled={saving}>{saving ? '...' : t('appointmentDetails.saveNotes')}</button>
                                : <button className="btn btn-solid" onClick={() => setNotesEditing(true)}>{t('appointmentDetails.editNotes')}</button>
                            }
                            <button className="btn btn-outline" onClick={() => navigate('/doctor/schedule')}>{t('appointmentDetails.backToSchedule')}</button>
                        </>
                    )}

                    {isDocView && app.status === 'Cancelled' && (
                        <button className="btn btn-outline" onClick={() => navigate('/doctor/schedule')}>{t('common.back')}</button>
                    )}

                    {!isDocView && app.status === 'Scheduled' && (
                        <>
                            <button className="btn btn-solid" onClick={handleSaveSymptoms} disabled={saving}>
                                {saving ? '...' : t('appointmentDetails.saveSymptoms')}
                            </button>
                            <button className="btn btn-outline" onClick={handleCancel}>{t('appointmentDetails.cancelVisit')}</button>
                            <button className="btn btn-outline" onClick={() => navigate('/appointments')}>{t('appointmentDetails.backToList')}</button>
                        </>
                    )}

                    {!isDocView && app.status !== 'Scheduled' && (
                        <button className="btn btn-outline w-full" onClick={() => navigate('/appointments')}>{t('appointmentDetails.backToMyAppointments')}</button>
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
