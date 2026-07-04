import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginRequest } from '../api/index'
import { VALIDATION } from '../constants'

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState('')
    const [loading, setLoading]   = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!VALIDATION.EMAIL_REGEX.test(email)) {
            setError('Введите корректный email')
            return
        }

        setLoading(true)
        try {
            const response = await loginRequest({ email, password })
            const user = response.data.user

            login(user, response.data.accessToken)
            navigate(user.role === 'doctor' ? '/doctor/schedule' : '/')

        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка соединения с сервером')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Добро пожаловать</h2>
                <p style={{ color: '#6b7280', marginBottom: '25px' }}>
                    Введите данные для входа
                </p>

                <form onSubmit={handleSubmit}>
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
                            {loading ? 'Вход...' : 'Войти'}
                        </button>
                    </div>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
                    <p>Нет аккаунта? <Link to="/register">Создать сейчас</Link></p>
                </div>
            </div>
        </div>
    )
}
