import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDoctorSlots } from '../api/index'
import { statusLabel, statusClass } from '../utils/status'
import { getTodayStr } from '../utils/date'
import Pagination from '../components/Pagination'
import StatCard from '../components/StatCard'

const PAGE_SIZE = 4

export default function DoctorSchedule() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const doctorId = user?.doctor_id

    const [date,    setDate]    = useState(getTodayStr())
    const [slots,   setSlots]   = useState([])
    const [loading, setLoading] = useState(false)
    const [page,    setPage]    = useState(0)

    const total  = slots.length
    const booked = slots.filter(s => s.status !== 'Free').length
    const free   = total - booked

    const fetchSlots = useCallback(async () => {
        if (!doctorId) return
        setLoading(true)
        setPage(0)
        try {
            const res = await getDoctorSlots(doctorId, date)
            setSlots(res.data.slots || [])
        } catch {
            setSlots([])
        } finally {
            setLoading(false)
        }
    }, [doctorId, date])

    useEffect(() => { fetchSlots() }, [fetchSlots])

    const totalPages = Math.ceil(slots.length / PAGE_SIZE)
    const pageSlots  = slots.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    return (
        <main className="container">
            <section className="page-title" style={{ textAlign: 'left' }}>
                <h2 style={{ fontWeight: 800 }}>Расписание на день</h2>
                <p>Управление записями пациентов</p>
            </section>

            <div className="dashboard-header">
                <StatCard variant="compact" label="Всего слотов" value={total} />
                <StatCard variant="compact" accent="active" label="Занято" value={booked} />
                <StatCard variant="compact" label="Свободно" value={free} />
            </div>

            <div className="schedule-card">
                <div className="schedule-controls">
                    <div className="date-input-group">
                        <label>🗓 День:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                        <button
                            className="btn btn-outline btn-sm"
                            style={{ marginLeft: '10px' }}
                            onClick={() => setDate(getTodayStr())}
                        >
                            Сегодня
                        </button>
                    </div>
                    <button className="btn btn-solid btn-sm" onClick={fetchSlots}>
                        🔄 Обновить
                    </button>
                </div>

                <ul className="slots-list">
                    {loading && (
                        <li className="slot-item empty">Загрузка расписания...</li>
                    )}

                    {!loading && pageSlots.length === 0 && (
                        <li className="slot-item empty">
                            <div className="slot-info">Нет слотов на этот день.</div>
                        </li>
                    )}

                    {!loading && pageSlots.map(slot => (
                        slot.status === 'Free' ? (
                            <li key={slot.time} className="slot-item empty">
                                <div className="slot-time">🕒 {slot.time}</div>
                                <div className="slot-info">Свободно для записи</div>
                            </li>
                        ) : (
                            <li key={slot.time} className="slot-item occupied">
                                <div className="slot-time">🕒 {slot.time}</div>
                                <div className="slot-info">
                                    <strong style={{ fontSize: '18px' }}>
                                        👤 {slot.patient_name || 'Пациент'}
                                    </strong>
                                    <span
                                        className={statusClass(slot.status)}
                                        style={{ margin: 0, padding: '2px 8px', fontSize: '10px' }}
                                    >
                                        {statusLabel(slot.status)}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-solid btn-sm"
                                    onClick={() => navigate(`/appointments/${slot.appointment_id}`)}
                                >
                                    Управление
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
