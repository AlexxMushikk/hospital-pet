import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminRecord, updateAdminRecord } from '../../../api/index'
import RecordFormShell from './RecordFormShell'

export default function PatientRecordForm({ id }) {
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        full_name: '', email: '', phone: '',
    })

    useEffect(() => {
        getAdminRecord('patients', id)
            .then(res => {
                const r = res.data
                setForm({
                    full_name: r.full_name || '',
                    email:     r.email || '',
                    phone:     r.phone || '',
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
            await updateAdminRecord('patients', id, form)
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
            title={`Редактирование пациента #${id}`}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
        >
            <label>ФИО</label>
            <input type="text" value={form.full_name} onChange={onChange('full_name')} required />

            <label>Email</label>
            <input type="email" value={form.email} onChange={onChange('email')} required />

            <label>Телефон</label>
            <input type="text" value={form.phone} onChange={onChange('phone')} />
        </RecordFormShell>
    )
}
