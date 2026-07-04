// src/pages/Login.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginRequest } from '../api/index'
import { VALIDATION } from '../constants'

// Называем импорт 'loginRequest' чтобы не конфликтовать
// с функцией 'login' из useAuth() — у них разные задачи:
//   loginRequest() — HTTP запрос к серверу
//   login()        — сохранить пользователя в контекст

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()

    // Каждое поле формы — отдельный кусок состояния.
    // В React нет document.getElementById — данные живут в useState.
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState('')
    const [loading, setLoading]   = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault() // как в старом коде — отменяем перезагрузку страницы
        setError('')        // сбрасываем предыдущую ошибку при новой попытке

        // Клиентская валидация — та же что была в auth.js
        if (!VALIDATION.EMAIL_REGEX.test(email)) {
            setError('Введите корректный email')
            return
        }

        setLoading(true)
        try {
            // loginRequest() — это наш api/index.js, не прямой fetch
            const response = await loginRequest({ email, password })
            const user = response.data.user

            // login() из AuthContext: сохраняет в useState + localStorage
            login(user, response.data.accessToken)

            // useNavigate() вместо window.location.hash
            navigate(user.role === 'doctor' ? '/doctor/schedule' : '/')

        } catch (err) {
            // axios кидает ошибку при статусах 4xx/5xx —
            // сообщение от сервера лежит в err.response.data.error
            setError(err.response?.data?.error || 'Ошибка соединения с сервером')
        } finally {
            // finally выполняется всегда — и при успехе и при ошибке
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
                        {/* value + onChange — это "controlled input".
                            React знает о каждом символе который ты вводишь.
                            Аналог: input.value в ванильном JS, но наоборот —
                            не ты читаешь из DOM, а React пишет в DOM из state. */}
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

                    {/* Ошибка показывается только если строка непустая */}
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
