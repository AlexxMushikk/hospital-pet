import useRecordForm from '../../../../hooks/useRecordForm'
import { useTranslation } from 'react-i18next'
import RecordFormShell from './RecordFormShell'
import DatePicker from '../../../../components/date-picker/DatePicker'
import { TIME_OPTIONS, VALIDATION } from '../../../../constants'

const STATUSES = [
    { value: 'Scheduled' },
    { value: 'Completed' },
    { value: 'Cancelled' },
]

const INITIAL = {
    appointment_date: '', appointment_time: '08:00',
    status: 'Scheduled', symptoms: '', doctor_notes: '',
}

const mapRecord = (r) => ({
    appointment_date: r.appointment_date || '',
    appointment_time: r.appointment_time || '08:00',
    status:           r.status || 'Scheduled',
    symptoms:         r.symptoms || '',
    doctor_notes:     r.doctor_notes || '',
})

const buildPayload = (form) => ({
    ...form,
    symptoms:     form.symptoms.trim()     || undefined,
    doctor_notes: form.doctor_notes.trim() || undefined,
})

export default function AppointmentRecordForm({ id }) {
    const { t } = useTranslation()
    const { loading, submitting, error, form, record, onChange, setField, handleSubmit } = useRecordForm({
        table: 'appointments',
        id,
        initialForm: INITIAL,
        mapRecord,
        buildPayload,
    })

    if (loading) return <main className="container"><p>{t('common.loading')}</p></main>

    return (
        <RecordFormShell
            title={t('adminRecords.editAppointment', { id })}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
        >
            <div className="record-summary">
                <p><strong>{t('common.patient')}:</strong> {record?.patient_name}</p>
                <p><strong>{t('common.doctor')}:</strong> {record?.doctor_name}</p>
            </div>

            <label>{t('common.date')}</label>
            <DatePicker
                value={form.appointment_date}
                onChange={(v) => setField('appointment_date', v)}
            />

            <label>{t('common.time')}</label>
            <select value={form.appointment_time} onChange={onChange('appointment_time')} required>
                {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
            </select>

            <label>{t('common.status')}</label>
            <select value={form.status} onChange={onChange('status')}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{t(`status.${s.value}`)}</option>)}
            </select>

            <label>{t('adminRecords.symptoms')}</label>
            <textarea rows={3} value={form.symptoms} onChange={onChange('symptoms')} maxLength={VALIDATION.SYMPTOMS_MAX} />

            <label>{t('adminRecords.doctorNotes')}</label>
            <textarea rows={3} value={form.doctor_notes} onChange={onChange('doctor_notes')} />
        </RecordFormShell>
    )
}
