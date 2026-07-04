import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminRecord, updateAdminRecord } from '../../../api/index'
import RecordFormShell from './RecordFormShell'

const SPECIALIZATIONS = [
    'Cardiology', 'Neurology', 'Diagnostics',
    'Surgery', 'Pediatrics', 'General Examination',
]

const GENDERS = [
    { value: 'Male',          label: 'Мужской' },
    { value: 'Female',        label: 'Женский' },
    { value: 'Not Specified', label: 'Не указан' },
]

const TIME_OPTIONS = (() => {
    const out = []
    for (let h = 0; h < 24; h++) {
        for (const m of [0, 30]) {
            out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
        }
    }
    return out
})()

export default function DoctorRecordForm({ id }) {
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        full_name: '', email: '', phone: '',
        specialization: '', career_start_date: '',
        education: '', bio: '', languages: '', image_url: '',
        price: '', work_start: '08:00', work_end: '18:00',
        gender: 'Not Specified',
    })

    useEffect(() => {
        getAdminRecord('doctors', id)
            .then(res => {
                const r = res.data
                setForm({
                    full_name:         r.name || '',
                    email:             r.email || '',
                    phone:             r.phone || '',
                    specialization:    r.specialization || '',
                    career_start_date: r.career_start_date || '',
                    education:         r.education || '',
                    bio:               r.bio || '',
                    languages:         r.languages || '',
                    image_url:         r.image_url || '',
                    price:             r.price ?? '',
                    work_start:        r.work_start || '08:00',
                    work_end:          r.work_end || '18:00',
                    gender:            r.gender || 'Not Specified',
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

        if (form.work_start >= form.work_end) {
            setError('Начало смены должно быть раньше конца')
            return
        }
        if (form.price !== '' && Number(form.price) < 0) {
            setError('Цена не может быть отрицательной')
            return
        }

        setSubmitting(true)
        try {
            await updateAdminRecord('doctors', id, {
                full_name:         form.full_name,
                email:             form.email,
                phone:             form.phone,
                specialization:    form.specialization,
                career_start_date: form.career_start_date,
                education:         form.education,
                bio:               form.bio,
                languages:         form.languages,
                image_url:         form.image_url,
                price:             form.price === '' ? undefined : Number(form.price),
                work_start:        form.work_start,
                work_end:          form.work_end,
                gender:            form.gender,
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
            title={`Редактирование врача #${id}`}
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

            <label>Специализация</label>
            <select value={form.specialization} onChange={onChange('specialization')} required>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label>Дата начала карьеры</label>
            <input type="date" value={form.career_start_date} onChange={onChange('career_start_date')} />

            <label>Цена визита (PLN)</label>
            <input type="number" min="0" value={form.price} onChange={onChange('price')} />

            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    <label>Начало смены</label>
                    <select value={form.work_start} onChange={onChange('work_start')}>
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label>Конец смены</label>
                    <select value={form.work_end} onChange={onChange('work_end')}>
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <label>Пол</label>
            <select value={form.gender} onChange={onChange('gender')}>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>

            <label>Образование</label>
            <input type="text" value={form.education} onChange={onChange('education')} />

            <label>Языки</label>
            <input type="text" value={form.languages} onChange={onChange('languages')} />

            <label>URL фото</label>
            <input type="text" value={form.image_url} onChange={onChange('image_url')} />

            <label>Биография</label>
            <textarea rows={4} value={form.bio} onChange={onChange('bio')} maxLength={1000} />
        </RecordFormShell>
    )
}
