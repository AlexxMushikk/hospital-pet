import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../../hooks/useModal'
import Modal from '../../../components/modal/Modal'
import api from '../../../api/index'
import { SPECIALIZATIONS, VALIDATION } from '../../../constants'
import { apiErrorMessage } from '../../../utils/apiError'
import StableText from '../../../components/stable-text/StableText'
import DatePicker from '../../../components/date-picker/DatePicker'
import { getTodayStr } from '../../../utils/date'
import '../../../styles/buttons.css'
import '../../../styles/forms.css'
import '../../../styles/layout.css'
import './CreateDoctor.css'

export default function CreateDoctor() {
    const navigate = useNavigate()
    const { modal, showModal, closeModal } = useModal()
    const { t } = useTranslation()

    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        full_name:         '',
        email:             '',
        password:          '',
        specialization:    '',
        gender:            'Not Specified',
        career_start_date: '',
        price:             200,
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.full_name || form.full_name.length < VALIDATION.NAME_MIN) {
            showModal(t('common.error'), t('validation.nameMin', { count: VALIDATION.NAME_MIN }))
            return
        }
        if (!VALIDATION.EMAIL_REGEX.test(form.email)) {
            showModal(t('common.error'), t('validation.email'))
            return
        }
        if (!form.password || form.password.length < VALIDATION.PASSWORD_MIN) {
            showModal(t('common.error'), t('validation.passwordMin', { count: VALIDATION.PASSWORD_MIN }))
            return
        }
        if (!form.specialization) {
            showModal(t('common.error'), t('adminCreateDoctor.errSpecialization'))
            return
        }
        if (!form.career_start_date) {
            showModal(t('common.error'), t('adminCreateDoctor.errCareerStart'))
            return
        }
        if (Number(form.price) < 0) {
            showModal(t('common.error'), t('validation.priceNegative'))
            return
        }

        setSaving(true)
        try {
            await api.post('/doctors', {
                ...form,
                price: Number(form.price),
            })
            showModal(
                t('adminCreateDoctor.createdTitle'),
                t('adminCreateDoctor.createdText', { name: form.full_name, email: form.email }),
                () => navigate('/admin/database')
            )
        } catch (err) {
            showModal(t('common.error'), apiErrorMessage(err, 'adminCreateDoctor.createError'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="container admin-section">
            <section className="page-title page-title--row">
                <div>
                    <h2>{t('adminCreateDoctor.title')}</h2>
                    <p>{t('adminCreateDoctor.subtitle')}</p>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/admin/database')}>
                    ← <StableText k="common.back" />
                </button>
            </section>

            <div className="form-narrow">
                <form onSubmit={handleSubmit}>

                    <div className="info-section">
                        <h3>{t('adminCreateDoctor.personalData')}</h3>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>{t('adminCreateDoctor.fullNameRequired')}</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={form.full_name}
                                    onChange={handleChange}
                                    placeholder="Dr. John Smith"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('common.gender')}</label>
                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    className="select-styled"
                                >
                                    <option value="Not Specified">{t('gender.Not Specified')}</option>
                                    <option value="Male">{t('gender.Male')}</option>
                                    <option value="Female">{t('gender.Female')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="doctor@hospital.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('adminCreateDoctor.passwordLabel')}</label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder={t('adminCreateDoctor.passwordPlaceholder', { count: VALIDATION.PASSWORD_MIN })}
                                required
                                minLength={VALIDATION.PASSWORD_MIN}
                            />
                        </div>
                    </div>

                    <div className="info-section">
                        <h3>{t('adminCreateDoctor.professionalData')}</h3>

                        <div className="form-group">
                            <label>{t('adminCreateDoctor.specializationRequired')}</label>
                            <select
                                name="specialization"
                                value={form.specialization}
                                onChange={handleChange}
                                className="select-styled"
                                required
                            >
                                <option value="">{t('adminCreateDoctor.specializationPlaceholder')}</option>
                                {SPECIALIZATIONS.map(s => (
                                    <option key={s.value} value={s.value}>{t(`spec.${s.value}.label`)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>{t('adminCreateDoctor.careerStartRequired')}</label>
                                <DatePicker
                                    value={form.career_start_date}
                                    onChange={(v) => setForm(prev => ({ ...prev, career_start_date: v }))}
                                    maxDate={getTodayStr()}
                                />                            </div>
                            <div className="form-group">
                                <label>{t('adminCreateDoctor.priceRequired')}</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    min={0}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="doctor-notes-box doctor-notes-box--mb">
                        <p className="notes-text">
                            <strong>{t('adminCreateDoctor.infoTitle')}</strong> {t('adminCreateDoctor.infoText')}
                        </p>
                    </div>

                    <div className="form-actions form-actions--end">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => navigate('/admin/database')}
                        >
                            <StableText k="common.cancel" />
                        </button>
                        <button
                            type="submit"
                            className="btn btn-solid"
                            disabled={saving}
                        >
                            {saving ? <StableText k="adminCreateDoctor.submitting" /> : <StableText k="adminCreateDoctor.submit" />}
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
        </main>
    )
}
