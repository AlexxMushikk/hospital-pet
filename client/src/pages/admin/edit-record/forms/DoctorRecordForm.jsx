import useRecordForm from '../../../../hooks/useRecordForm'
import { useTranslation } from 'react-i18next'
import RecordFormShell from './RecordFormShell'
import DatePicker from '../../../../components/date-picker/DatePicker'
import { TIME_OPTIONS } from '../../../../constants'
import { getTodayStr } from '../../../../utils/date'

const SPECIALIZATIONS = [
    'Cardiology', 'Neurology', 'Diagnostics',
    'Surgery', 'Pediatrics', 'General Examination',
]

const GENDERS = [
    { value: 'Male' },
    { value: 'Female' },
    { value: 'Not Specified' },
]

const INITIAL = {
    full_name: '', email: '', phone: '',
    specialization: '', career_start_date: '',
    education: '', bio: '', languages: '', image_url: '',
    price: '', work_start: '08:00', work_end: '18:00',
    gender: 'Not Specified',
}

const mapRecord = (r) => ({
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

const validate = (form) => {
    if (form.work_start >= form.work_end) return 'validation.shiftStartAfterEnd'
    if (form.price !== '' && Number(form.price) < 0) return 'validation.priceNegative'
    return null
}

const buildPayload = (form) => ({
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

export default function DoctorRecordForm({ id }) {
    const { t } = useTranslation()
    const { loading, submitting, error, form, onChange, setField, handleSubmit } = useRecordForm({
        table: 'doctors',
        id,
        initialForm: INITIAL,
        mapRecord,
        buildPayload,
        validate,
    })

    if (loading) return <main className="container"><p>{t('common.loading')}</p></main>

    return (
        <RecordFormShell
            title={t('adminRecords.editDoctor', { id })}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
        >
            <label>{t('common.fullName')}</label>
            <input type="text" value={form.full_name} onChange={onChange('full_name')} required />

            <label>Email</label>
            <input type="email" value={form.email} onChange={onChange('email')} required />

            <label>{t('common.phone')}</label>
            <input type="text" value={form.phone} onChange={onChange('phone')} />

            <label>{t('common.specialization')}</label>
            <select value={form.specialization} onChange={onChange('specialization')} required>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{t(`spec.${s}.label`)}</option>)}
            </select>

            <label>{t('adminRecords.careerStart')}</label>
            <DatePicker
                value={form.career_start_date}
                onChange={(v) => setField('career_start_date', v)}
                maxDate={getTodayStr()}
            />

            <label>{t('adminRecords.visitPrice')}</label>
            <input type="number" min="0" value={form.price} onChange={onChange('price')} />

            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    <label>{t('adminRecords.shiftStart')}</label>
                    <select value={form.work_start} onChange={onChange('work_start')}>
                        {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label>{t('adminRecords.shiftEnd')}</label>
                    <select value={form.work_end} onChange={onChange('work_end')}>
                        {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                </div>
            </div>

            <label>{t('common.gender')}</label>
            <select value={form.gender} onChange={onChange('gender')}>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{t(`gender.${g.value}`)}</option>)}
            </select>

            <label>{t('common.education')}</label>
            <input type="text" value={form.education} onChange={onChange('education')} />

            <label>{t('common.languages')}</label>
            <input type="text" value={form.languages} onChange={onChange('languages')} />

            <label>{t('common.photoUrl')}</label>
            <input type="text" value={form.image_url} onChange={onChange('image_url')} />

            <label>{t('adminRecords.bio')}</label>
            <textarea rows={4} value={form.bio} onChange={onChange('bio')} maxLength={1000} />
        </RecordFormShell>
    )
}
