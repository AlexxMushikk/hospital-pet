import { useState, useEffect } from 'react'
import { getAdminStats, getAdminRecentActivity } from '../../api/index'
import { statusLabel, statusClass } from '../../utils/status'

export default function AdminStats() {
    const [stats,    setStats]    = useState(null)
    const [activity, setActivity] = useState([])
    const [loading,  setLoading]  = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    getAdminStats(),
                    getAdminRecentActivity()
                ])
                setStats(statsRes.data)
                setActivity(activityRes.data)
            } catch {
                // молча — данные просто не отобразятся
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    if (loading) {
        return (
            <section className="admin-section container">
                <div className="stats-grid">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />
                    ))}
                </div>
            </section>
        )
    }

    return (
        <section className="admin-section container">
            <section className="page-title">
                <h2>Статистика больницы</h2>
            </section>

            <div className="stats-grid">
                <div className="stat-box">
                    <p className="stat-label">Всего записей</p>
                    <p className="stat-value">{stats?.totalAppointments ?? 0}</p>
                </div>
                <div className="stat-box">
                    <p className="stat-label">Активных врачей</p>
                    <p className="stat-value">{stats?.activeDoctors ?? 0}</p>
                </div>
                <div className="stat-box">
                    <p className="stat-label">Пациентов</p>
                    <p className="stat-value">{stats?.totalPatients ?? 0}</p>
                </div>
                <div className="stat-box" style={{ borderTopColor: '#16a34a' }}>
                    <p className="stat-label">Общий доход</p>
                    <p className="stat-value">
                        {new Intl.NumberFormat('pl-PL').format(stats?.totalRevenue || 0)} PLN
                    </p>
                </div>
            </div>

            <div className="info-section">
                <h3>Последняя активность</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Пациент</th>
                            <th>Врач</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activity.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center' }}>Нет данных</td>
                            </tr>
                        )}
                        {activity.map((act, i) => (
                            <tr key={i}>
                                <td>{act.date || '---'}</td>
                                <td>{act.patient_name || 'Неизвестен'}</td>
                                <td>{act.doctor_name  || 'Неизвестен'}</td>
                                <td>
                                    <span className={statusClass(act.status)}>
                                        {statusLabel(act.status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
