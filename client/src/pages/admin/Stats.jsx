import { useState, useEffect } from 'react'
import { getAdminStats, getAdminRecentActivity } from '../../api/index'
import { statusLabel, statusClass } from '../../utils/status'
import StatCard from '../../components/StatCard'
import {logger} from "../../utils/logger.js";

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
            } catch (err) {
                logger.error('AdminStats.fetch', err)
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
                        <div key={i} className="skeleton skeleton--stat" />
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
                <StatCard variant="large" label="Всего записей"   value={stats?.totalAppointments ?? 0} />
                <StatCard variant="large" label="Активных врачей" value={stats?.activeDoctors ?? 0} />
                <StatCard variant="large" label="Пациентов"       value={stats?.totalPatients ?? 0} />
                <StatCard
                    variant="large"
                    accent="revenue"
                    label="Общий доход"
                    value={`${new Intl.NumberFormat('pl-PL').format(stats?.totalRevenue || 0)} PLN`}
                />
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
                            <td colSpan={4} className="text-center">Нет данных</td>
                        </tr>
                    )}
                    {activity.map((act) => (
                        <tr key={act.id}>
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
