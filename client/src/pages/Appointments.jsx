import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getPatientAppointments } from '../api/index'
import { statusLabel, statusClass } from '../utils/status'
import { formatDate } from '../utils/date'

export default function Appointments() {
    const { user }   = useAuth()
    const navigate   = useNavigate()
    const { t }      = useTranslation()

    const [appointments, setAppointments] = useState([])
    const [loading,      setLoading]      = useState(true)
    const [error,        setError]        = useState('')

    useEffect(() => {
        if (!user?.patient_id) return
        const fetchAppointments = async () => {
            try {
                const res = await getPatientAppointments(user.patient_id)
                setAppointments(res.data)
            } catch {
                setError('appointments.loadError')
            } finally {
                setLoading(false)
            }
        }
        fetchAppointments()
    }, [user?.patient_id])

    if (loading) {
        return (
            <main className="container">
                <section className="page-title"><h2>{t('appointments.title')}</h2></section>
                <div className="doctors-grid">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="doctor-card">
                            <div className="doctor-photo-box skeleton" />
                            <div className="doctor-info skeleton-info">
                                <div className="skeleton skeleton-text" />
                                <div className="skeleton skeleton-text skeleton-text--sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        )
    }

    return (
        <main className="container">
            <section className="page-title">
                <h2>{t('appointments.title')}</h2>
                <p>{t('appointments.subtitle')}</p>
            </section>

            {error && (
                <p className="text-error">{t(error)}</p>
            )}

            {!error && appointments.length === 0 && (
                <div className="empty-state">
                    <p>{t('appointments.empty')}</p>
                    <Link to="/doctors" className="btn btn-solid">{t('appointments.emptyCta')}</Link>
                </div>
            )}

            {appointments.length > 0 && (
                <div className="doctors-grid">
                    {appointments.map(app => (
                        <div key={app.id} className="doctor-card">
                            <div className="doctor-photo-box">
                                <span className="appointment-icon">📅</span>
                            </div>
                            <div className="doctor-info">
                                <div>
                                    <span className={statusClass(app.status)}>
                                        {statusLabel(app.status)}
                                    </span>
                                    <span className="doctor-name appt-name">
                                        {app.doctor_name || t('common.doctor')}
                                    </span>
                                    <span className="appt-spec">{t(`spec.${app.doctor_spec}.label`, { defaultValue: app.doctor_spec })}</span>
                                    <p className="appt-datetime">
                                        {t('appointments.dateAt', { date: formatDate(app.appointment_date), time: app.appointment_time })}
                                    </p>
                                </div>
                                <button
                                    className="btn btn-solid btn-sm"
                                    onClick={() => navigate(`/appointments/${app.id}`)}
                                >
                                    {t('common.details')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}
