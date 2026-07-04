import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerRequest } from '../api/index'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'

export default function Register() {
    const navigate = useNavigate()
    const { modal, showModal, closeModal } = useModal()

    const [fullName, setFullName] = useState('')
    const [email,    setEmail]    = useState('')
    const [password, setPassword] = useState('')
    const [error,    setError]    = useState('')
    const [loading,  setLoading]  = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (fullName.length < 2) {
            setError('Имя должно содержать минимум 2 символа')
            return
        }
        if (password.length < 4) {
            setError('Пароль должен содержать минимум 4 символа')
            return
        }

        setLoading(true)
        try {
            await registerRequest({ full_name: fullName, email, password })
            showModal(
                'Аккаунт создан!',
                'Регистрация прошла успешно. Войдите в систему.',
                () => navigate('/login')
            )
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка соединения с сервером')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Создать аккаунт</h2>
                <p style={{ color: '#6b7280', marginBottom: '25px' }}>
                    Присоединяйтесь к City Care Hospital
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Полное имя</label>
                        <input
                            type="text"
                            placeholder="Иван Иванов"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                            minLength={2}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Пароль</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={4}
                        />
                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-solid w-full"
                            disabled={loading}
                        >
                            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                        </button>
                    </div>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
                    <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
                </div>
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