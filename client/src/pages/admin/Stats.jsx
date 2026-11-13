import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminStats, getAdminRecentActivity } from '../../api/index'
import { statusLabel, statusClass } from '../../utils/status'
import StatCard from '../../components/StatCard'
import {logger} from "../../utils/logger.js";

export default function AdminStats() {
    const { t } = useTranslation()
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
                <h2>{t('adminStats.title')}</h2>
            </section>

            <div className="stats-grid">
                <StatCard variant="large" label={t('adminStats.totalAppointments')} value={stats?.totalAppointments ?? 0} />
                <StatCard variant="large" label={t('adminStats.activeDoctors')} value={stats?.activeDoctors ?? 0} />
                <StatCard variant="large" label={t('adminStats.totalPatients')} value={stats?.totalPatients ?? 0} />
                <StatCard
                    variant="large"
                    accent="revenue"
                    label={t('adminStats.totalRevenue')}
                    value={`${new Intl.NumberFormat('pl-PL').format(stats?.totalRevenue || 0)} PLN`}
                />
            </div>

            <div className="info-section">
                <h3>{t('adminStats.recentActivity')}</h3>
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th>{t('common.date')}</th>
                        <th>{t('common.patient')}</th>
                        <th>{t('common.doctor')}</th>
                        <th>{t('common.status')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {activity.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center">{t('adminStats.noData')}</td>
                        </tr>
                    )}
                    {activity.map((act) => (
                        <tr key={act.id}>
                            <td>{act.date || '---'}</td>
                            <td>{act.patient_name || t('common.unknown')}</td>
                            <td>{act.doctor_name  || t('common.unknown')}</td>
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
