import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getDoctorSlots, createAppointment, getDoctor } from '../../api/index'
import Modal from '../../components/modal/Modal'
import { useModal } from '../../hooks/useModal'
import { getTodayStr, formatDate } from '../../utils/date'
import DatePicker from '../../components/date-picker/DatePicker'
import { logger } from '../../utils/logger'
import { SLOT_STEP_MINUTES, VALIDATION } from '../../constants'
import { apiErrorMessage } from '../../utils/apiError'
import '../../styles/buttons.css'
import '../../styles/forms.css'
import '../../styles/layout.css'
import './Booking.css'

export default function Booking() {
    const navigate                         = useNavigate()
    const { user }                         = useAuth()
    const { modal, showModal, closeModal } = useModal()
    const { t }                            = useTranslation()

    const [searchParams]              = useSearchParams()
    const doctorId                    = searchParams.get('doctorId')
    const doctorName                  = searchParams.get('name') || t('common.doctor')

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
            .catch(err => logger.error('Booking.doctorPrice', err))
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
        if (symptoms.length > VALIDATION.SYMPTOMS_MAX) {
            showModal(t('common.error'), t('validation.symptomsMax', { count: VALIDATION.SYMPTOMS_MAX }))
            return
        }
        if (user.doctor_id && parseInt(user.doctor_id, 10) === parseInt(doctorId, 10)) {
            showModal(t('common.error'), t('booking.selfBookError'))
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
                t('booking.confirmedTitle'),
                t('booking.confirmedText', { doctor: doctorName, date: formatDate(date), time: selectedTime }),
                () => navigate('/appointments')
            )
        } catch (err) {
            showModal(t('common.error'), apiErrorMessage(err))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card auth-card--md">
                <h2 className="booking-title">{t('booking.title')}</h2>

                <div className="booking-summary">
                    <p className="booking-to">
                        {t('booking.withDoctor')} <strong>{decodeURIComponent(doctorName)}</strong>
                    </p>
                    <p className="booking-patient">
                        {t('booking.patient')} {user?.full_name}
                    </p>
                    {doctorPrice && (
                        <p className="booking-price">
                            {t('booking.price', { price: doctorPrice })}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="booking-form">

                    <div className="form-group">
                        <label>{t('booking.stepDate')}</label>
                        <DatePicker
                            value={date}
                            onChange={setDate}
                            minDate={getTodayStr()}
                        />
                    </div>

                    <div className="time-section">
                        <label className="time-label">
                            {t('booking.stepTime', { minutes: SLOT_STEP_MINUTES })}
                        </label>

                        {slotsLoading && (
                            <p className="text-muted">{t('booking.loadingSlots')}</p>
                        )}

                        {!slotsLoading && slotsError && (
                            <p className="text-danger">
                                {t('booking.slotsError')}
                            </p>
                        )}

                        {!slotsLoading && !slotsError && slots.length === 0 && (
                            <p className="text-muted">{t('booking.noSlots')}</p>
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
                                <p className="slots-legend">
                                    <span className="dot-available">●</span> {t('booking.legendAvailable')} |{' '}
                                    <span className="dot-booked">●</span> {t('booking.legendBooked')}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="form-group form-group--spaced">
                        <label>{t('booking.stepSymptoms')}</label>
                        <textarea
                            value={symptoms}
                            onChange={e => setSymptoms(e.target.value)}
                            maxLength={VALIDATION.SYMPTOMS_MAX}
                            placeholder={t('booking.symptomsPlaceholder')}
                            className="appt-textarea"
                        />
                        <div className={`char-counter ${symptoms.length > 220 ? 'char-counter--warn' : ''}`}>
                            {symptoms.length} / {VALIDATION.SYMPTOMS_MAX}
                        </div>
                    </div>

                    <div className="form-actions form-actions--mt">
                        {selectedTime && (
                            <button type="submit" className="btn btn-solid w-full" disabled={submitting}>
                                {submitting ? t('booking.submitting') : t('booking.submit', { time: selectedTime })}
                            </button>
                        )}
                        <button type="button" className="btn btn-outline w-full" onClick={() => navigate(-1)}>
                            {t('common.back')}
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
