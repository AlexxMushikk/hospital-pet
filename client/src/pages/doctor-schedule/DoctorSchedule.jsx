import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getDoctorSlots } from '../../api/index'
import { statusLabel, statusClass } from '../../utils/status'
import { getTodayStr } from '../../utils/date'
import Pagination from '../../components/pagination/Pagination'
import DatePicker from '../../components/date-picker/DatePicker'
import StatCard from '../../components/stat-card/StatCard'

const PAGE_SIZE = 4

export default function DoctorSchedule() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { t } = useTranslation()
    const doctorId = user?.doctor_id

    const [date,       setDate]       = useState(getTodayStr())
    const [slots,      setSlots]      = useState([])
    const [loading,    setLoading]    = useState(false)
    const [page,       setPage]       = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)

    const total  = slots.length
    const booked = slots.filter(s => s.status !== 'Free').length
    const free   = total - booked

    useEffect(() => {
        if (!doctorId) return
        let cancelled = false

        const load = async () => {
            setLoading(true)
            try {
                const res = await getDoctorSlots(doctorId, date)
                if (!cancelled) setSlots(res.data.slots || [])
            } catch {
                if (!cancelled) setSlots([])
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void load()
        return () => { cancelled = true }
    }, [doctorId, date, refreshKey])

    const handleDateChange = (next) => {
        setDate(next)
        setPage(0)
    }

    const totalPages = Math.ceil(slots.length / PAGE_SIZE)
    const pageSlots  = slots.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    return (
        <main className="container">
            <section className="page-title page-title--left">
                <h2>{t('schedule.title')}</h2>
                <p>{t('schedule.subtitle')}</p>
            </section>

            <div className="dashboard-header">
                <StatCard variant="compact" label={t('schedule.totalSlots')} value={total} />
                <StatCard variant="compact" accent="active" label={t('schedule.booked')} value={booked} />
                <StatCard variant="compact" label={t('schedule.free')} value={free} />
            </div>

            <div className="schedule-card">
                <div className="schedule-controls">
                    <div className="schedule-day">
                        <label>{t('schedule.dayLabel')}</label>
                        <DatePicker
                            className="datepicker--compact"
                            value={date}
                            onChange={handleDateChange}
                        />
                    </div>
                    <button
                        className="btn btn-solid btn-sm"
                        onClick={() => setRefreshKey(k => k + 1)}
                    >
                        {t('schedule.refresh')}
                    </button>
                </div>

                <ul className="slots-list">
                    {loading && (
                        <li className="slot-item empty">{t('schedule.loading')}</li>
                    )}

                    {!loading && pageSlots.length === 0 && (
                        <li className="slot-item empty">
                            <div className="slot-info">{t('schedule.noSlots')}</div>
                        </li>
                    )}

                    {!loading && pageSlots.map(slot => (
                        slot.status === 'Free' ? (
                            <li key={slot.time} className="slot-item empty">
                                <div className="slot-time">🕒 {slot.time}</div>
                                <div className="slot-info">{t('schedule.freeSlot')}</div>
                            </li>
                        ) : (
                            <li key={slot.time} className="slot-item occupied">
                                <div className="slot-time">🕒 {slot.time}</div>
                                <div className="slot-info">
                                    <strong className="slot-patient">
                                        👤 {slot.patient_name || t('common.patient')}
                                    </strong>
                                    <span
                                        className={`${statusClass(slot.status)} slot-status`}
                                    >
                                        {statusLabel(slot.status)}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-solid btn-sm"
                                    onClick={() => navigate(`/appointments/${slot.appointment_id}`)}
                                >
                                    {t('schedule.manage')}
                                </button>
                            </li>
                        )
                    ))}
                </ul>

                <Pagination
                    currentPage={page + 1}
                    totalPages={totalPages}
                    onPageChange={p => setPage(p - 1)}
                />
            </div>
        </main>
    )
}
