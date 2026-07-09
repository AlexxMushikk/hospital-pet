import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPatientAppointments } from '../api/index'
import { statusLabel, statusClass } from '../utils/status'
import { formatDate } from '../utils/date'

export default function Appointments() {
    const { user }   = useAuth()
    const navigate   = useNavigate()

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
                setError('Не удалось загрузить список визитов.')
            } finally {
                setLoading(false)
            }
        }
        fetchAppointments()
    }, [user?.patient_id])

    if (loading) {
        return (
            <main className="container">
                <section className="page-title"><h2>Мои визиты</h2></section>
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
                <h2>Мои визиты</h2>
                <p>История и предстоящие записи к врачам.</p>
            </section>

            {error && (
                <p className="text-error">{error}</p>
            )}

            {!error && appointments.length === 0 && (
                <div className="empty-state">
                    <p>У вас пока нет записей к врачам.</p>
                    <Link to="/doctors" className="btn btn-solid">Записаться к врачу</Link>
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
                                        {app.doctor_name || 'Врач'}
                                    </span>
                                    <span className="appt-spec">{app.doctor_spec}</span>
                                    <p className="appt-datetime">
                                        {formatDate(app.appointment_date)} в {app.appointment_time}
                                    </p>
                                </div>
                                <button
                                    className="btn btn-solid btn-sm"
                                    onClick={() => navigate(`/appointments/${app.id}`)}
                                >
                                    Подробнее
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}
