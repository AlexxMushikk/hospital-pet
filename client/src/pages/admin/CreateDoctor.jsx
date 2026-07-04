import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../hooks/useModal'
import Modal from '../../components/Modal'
import api from '../../api/index'

const SPECIALIZATIONS = [
    'Cardiology', 'Diagnostics', 'General Examination',
    'Neurology', 'Pediatrics', 'Surgery'
]

const SPEC_LABELS = {
    'Cardiology':          'Кардиология',
    'Diagnostics':         'Диагностика',
    'General Examination': 'Общий осмотр',
    'Neurology':           'Неврология',
    'Pediatrics':          'Педиатрия',
    'Surgery':             'Хирургия',
}

export default function CreateDoctor() {
    const navigate = useNavigate()
    const { modal, showModal, closeModal } = useModal()

    const [saving, setSaving] = useState(false)

    // Все поля формы в одном объекте — удобнее чем 7 отдельных useState
    const [form, setForm] = useState({
        full_name:         '',
        email:             '',
        password:          '',
        specialization:    '',
        gender:            'Not Specified',
        career_start_date: '',
        price:             200,
    })

    // Единый обработчик для всех полей формы.
    // [e.target.name] — вычисляемое имя свойства, берёт name атрибут инпута.
    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Клиентская валидация
        if (!form.full_name || form.full_name.length < 2) {
            showModal('Ошибка', 'Введите полное имя (минимум 2 символа).')
            return
        }
        if (!form.email.includes('@')) {
            showModal('Ошибка', 'Введите корректный email.')
            return
        }
        if (!form.password || form.password.length < 4) {
            showModal('Ошибка', 'Пароль должен содержать минимум 4 символа.')
            return
        }
        if (!form.specialization) {
            showModal('Ошибка', 'Выберите специализацию.')
            return
        }
        if (!form.career_start_date) {
            showModal('Ошибка', 'Укажите дату начала карьеры.')
            return
        }
        if (Number(form.price) < 0) {
            showModal('Ошибка', 'Цена не может быть отрицательной.')
            return
        }

        setSaving(true)
        try {
            await api.post('/doctors', {
                ...form,
                price: Number(form.price),
            })
            showModal(
                'Врач создан!',
                `Аккаунт для ${form.full_name} успешно создан. Врач может войти с email ${form.email}.`,
                () => navigate('/admin/database')
            )
        } catch (err) {
            showModal('Ошибка', err.response?.data?.error || 'Не удалось создать врача.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="container admin-section">
            <section className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Создать нового врача</h2>
                    <p>Заполните данные для создания аккаунта врача.</p>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/admin/database')}>
                    ← Назад
                </button>
            </section>

            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>

                    {/* ── ЛИЧНЫЕ ДАННЫЕ ── */}
                    <div className="info-section">
                        <h3>Личные данные</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Полное имя *</label>
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
                                <label>Пол</label>
                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' }}
                                >
                                    <option value="Not Specified">Не указан</option>
                                    <option value="Male">Мужской</option>
                                    <option value="Female">Женский</option>
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
                            <label>Пароль * (врач сможет сменить позже)</label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Минимум 4 символа"
                                required
                                minLength={4}
                            />
                        </div>
                    </div>

                    {/* ── ПРОФЕССИОНАЛЬНЫЕ ДАННЫЕ ── */}
                    <div className="info-section">
                        <h3>Профессиональные данные</h3>

                        <div className="form-group">
                            <label>Специализация *</label>
                            <select
                                name="specialization"
                                value={form.specialization}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' }}
                                required
                            >
                                <option value="">— Выберите специализацию —</option>
                                {SPECIALIZATIONS.map(s => (
                                    <option key={s} value={s}>{SPEC_LABELS[s]}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Дата начала карьеры *</label>
                                <input
                                    type="date"
                                    name="career_start_date"
                                    value={form.career_start_date}
                                    onChange={handleChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Стоимость визита (PLN) *</label>
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

                    {/* ── ИНФО ── */}
                    <div className="doctor-notes-box" style={{ marginBottom: '30px' }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                            <strong>После создания</strong> врач сможет войти в систему и заполнить
                            профиль самостоятельно: фото, биографию, образование, языки.
                            Рабочие часы по умолчанию 08:00 — 18:00, изменить можно в разделе
                            "База данных → Изменить".
                        </p>
                    </div>

                    <div className="form-actions" style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: '15px' }}>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => navigate('/admin/database')}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="btn btn-solid"
                            disabled={saving}
                        >
                            {saving ? 'Создание...' : 'Создать врача'}
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