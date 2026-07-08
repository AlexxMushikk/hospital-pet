import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminRecord, updateAdminRecord } from '../../../api/index'
import RecordFormShell from './RecordFormShell'
import { TIME_OPTIONS } from '../../../constants'

const STATUSES = [
    { value: 'Scheduled', label: 'Запланирован' },
    { value: 'Completed', label: 'Завершён' },
    { value: 'Cancelled', label: 'Отменён' },
]

export default function AppointmentRecordForm({ id }) {
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [meta, setMeta] = useState({ doctor_name: '', patient_name: '' })

    const [form, setForm] = useState({
        appointment_date: '', appointment_time: '08:00',
        status: 'Scheduled', symptoms: '', doctor_notes: '',
    })

    useEffect(() => {
        getAdminRecord('appointments', id)
            .then(res => {
                const r = res.data
                setMeta({
                    doctor_name:  r.doctor_name  || '',
                    patient_name: r.patient_name || '',
                })
                setForm({
                    appointment_date: r.appointment_date || '',
                    appointment_time: r.appointment_time || '08:00',
                    status:           r.status || 'Scheduled',
                    symptoms:         r.symptoms || '',
                    doctor_notes:     r.doctor_notes || '',
                })
            })
            .catch(err => setError(err.response?.data?.error || 'Не удалось загрузить запись'))
            .finally(() => setLoading(false))
    }, [id])

    const onChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        setSubmitting(true)
        try {
            await updateAdminRecord('appointments', id, {
                ...form,
                symptoms:     form.symptoms.trim()     || undefined,
                doctor_notes: form.doctor_notes.trim() || undefined,
            })
            navigate('/admin/database')
        } catch (err) {
            setError(err.response?.data?.error || 'Не удалось сохранить')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <main className="container"><p>Загрузка...</p></main>

    return (
        <RecordFormShell
            title={`Редактирование записи #${id}`}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
        >
            <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                <p style={{ margin: 0 }}><strong>Пациент:</strong> {meta.patient_name}</p>
                <p style={{ margin: '5px 0 0' }}><strong>Врач:</strong> {meta.doctor_name}</p>
            </div>

            <label>Дата</label>
            <input type="date" value={form.appointment_date} onChange={onChange('appointment_date')} required />

            <label>Время</label>
            <select value={form.appointment_time} onChange={onChange('appointment_time')} required>
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label>Статус</label>
            <select value={form.status} onChange={onChange('status')}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <label>Симптомы</label>
            <textarea rows={3} value={form.symptoms} onChange={onChange('symptoms')} maxLength={250} />

            <label>Заметки врача</label>
            <textarea rows={3} value={form.doctor_notes} onChange={onChange('doctor_notes')} />
        </RecordFormShell>
    )
}
