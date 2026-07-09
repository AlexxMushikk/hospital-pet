import useRecordForm from '../../../hooks/useRecordForm'
import RecordFormShell from './RecordFormShell'

const INITIAL = { full_name: '', email: '', phone: '' }

const mapRecord = (r) => ({
    full_name: r.full_name || '',
    email:     r.email || '',
    phone:     r.phone || '',
})

export default function PatientRecordForm({ id }) {
    const { loading, submitting, error, form, onChange, handleSubmit } = useRecordForm({
        table: 'patients',
        id,
        initialForm: INITIAL,
        mapRecord,
    })

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
