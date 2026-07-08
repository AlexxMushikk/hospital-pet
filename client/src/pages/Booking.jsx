import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDoctorSlots, createAppointment, getDoctor } from '../api/index'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { getTodayStr } from '../utils/date'
import { SLOT_STEP_MINUTES } from '../constants'

export default function Booking() {
    const navigate                         = useNavigate()
    const { user }                         = useAuth()
    const { modal, showModal, closeModal } = useModal()

    const [searchParams]              = useSearchParams()
    const doctorId                    = searchParams.get('doctorId')
    const doctorName                  = searchParams.get('name') || 'Врач'

    const [date,         setDate]         = useState(getTodayStr())
    const [slots,        setSlots]        = useState([])
    const [selectedTime, setSelectedTime] = useState(null)
    const [symptoms,     setSymptoms]     = useState('')
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [slotsError,   setSlotsError]   = useState(false)
    const [submitting,   setSubmitting]   = useState(false)
    const [doctorPrice,  setDoctorPrice]  = useState(null)

    useEffect(() => {
        if (!doctorId || !user) navigate('/doctors')
    }, [doctorId, user, navigate])

    useEffect(() => {
        if (!doctorId) return
        getDoctor(doctorId)
            .then(res => setDoctorPrice(res.data.price))
            .catch(() => {})
    }, [doctorId])

    useEffect(() => {
        if (!doctorId) return
        const fetchSlots = async () => {
            setSlotsLoading(true)
            setSlotsError(false)
            setSelectedTime(null)
            try {
                const res = await getDoctorSlots(doctorId, date)
                setSlots(res.data.slots)
            } catch {
                setSlots([])
                setSlotsError(true)
            } finally {
                setSlotsLoading(false)
            }
        }
        fetchSlots()
    }, [date, doctorId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedTime) return
        if (symptoms.length > 250) {
            showModal('Ошибка', 'Описание симптомов слишком длинное (макс. 250 символов).')
            return
        }
        if (user.doctor_id && parseInt(user.doctor_id, 10) === parseInt(doctorId, 10)) {
            showModal('Ошибка', 'Вы не можете записаться к себе.')
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                doctor_id:        parseInt(doctorId, 10),
                appointment_date: date,
                appointment_time: selectedTime,
            }
            const trimmed = symptoms.trim()
            if (trimmed) payload.symptoms = trimmed

            await createAppointment(payload)
            showModal(
                'Запись подтверждена!',
                `Вы записаны к ${doctorName} на ${date} в ${selectedTime}.`,
                () => navigate('/appointments')
            )
        } catch (err) {
            showModal('Ошибка', err.response?.data?.error || 'Слот уже занят. Выберите другое время.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '700px' }}>
                <h2 style={{ marginBottom: '10px' }}>Запись к врачу</h2>

                <div className="booking-summary" style={{ marginBottom: '25px' }}>
                    <p style={{ margin: 0 }}>
                        Запись к: <strong>{decodeURIComponent(doctorName)}</strong>
                    </p>
                    <p style={{ margin: '5px 0 0', fontSize: '0.9em', color: '#666' }}>
                        Пациент: {user?.full_name}
                    </p>
                    {/* Показываем цену только когда загрузилась — не показываем пока null */}
                    {doctorPrice && (
                        <p style={{ margin: '8px 0 0', fontWeight: 'bold', color: '#dc2626' }}>
                            Стоимость визита: {doctorPrice} PLN
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>

                    <div className="form-group">
                        <label>1. Выберите дату</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="date"
                                value={date}
                                min={getTodayStr()}
                                onChange={e => setDate(e.target.value)}
                                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' }}
                            />
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setDate(getTodayStr())}
                            >
                                Сегодня
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
                            2. Выберите время (слоты по {SLOT_STEP_MINUTES} минут)
                        </label>

                        {slotsLoading && (
                            <p style={{ color: '#6b7280' }}>Загрузка слотов...</p>
                        )}

                        {!slotsLoading && slotsError && (
                            <p style={{ color: '#dc2626' }}>
                                Не удалось загрузить слоты. Попробуйте обновить страницу.
                            </p>
                        )}

                        {!slotsLoading && !slotsError && slots.length === 0 && (
                            <p style={{ color: '#6b7280' }}>Нет доступных слотов на эту дату.</p>
                        )}

                        {!slotsLoading && !slotsError && slots.length > 0 && (
                            <>
                                <div className="slots-grid">
                                    {slots.map(slot => {
                                        const isBooked   = slot.status !== 'Free'
                                        const isSelected = selectedTime === slot.time
                                        return (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                className={`slot-btn ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                                                disabled={isBooked}
                                                onClick={() => setSelectedTime(slot.time)}
                                            >
                                                {slot.time}
                                            </button>
                                        )
                                    })}
                                </div>
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                    <span style={{ color: '#dc2626' }}>●</span> Доступно |{' '}
                                    <span style={{ color: '#e5e7eb' }}>●</span> Занято
                                </p>
                            </>
                        )}
                    </div>

                    <div className="form-group" style={{ marginTop: '25px' }}>
                        <label>3. Симптомы / Причина визита (необязательно)</label>
                        <textarea
                            value={symptoms}
                            onChange={e => setSymptoms(e.target.value)}
                            maxLength={250}
                            placeholder="Кратко опишите симптомы..."
                            style={{ width: '100%', minHeight: '80px', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '11px', color: symptoms.length > 220 ? '#dc2626' : '#999' }}>
                            {symptoms.length} / 250
                        </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: '30px' }}>
                        {selectedTime && (
                            <button type="submit" className="btn btn-solid w-full" disabled={submitting}>
                                {submitting ? 'Отправка...' : `Подтвердить запись на ${selectedTime}`}
                            </button>
                        )}
                        <button type="button" className="btn btn-outline w-full" onClick={() => navigate(-1)}>
                            Назад
                        </button>
                    </div>

                </form>
            </div>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
            />
        </div>
    )
}
