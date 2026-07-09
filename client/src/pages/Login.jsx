import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginRequest } from '../api/index'
import { VALIDATION } from '../constants'
import AuthForm, { AuthField } from '../components/AuthForm'

export default function Login() {
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
            login(response.data.user, response.data.accessToken)
            // Редирект по роли делает роут /login в App.jsx — без гонки с navigate.
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка соединения с сервером')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthForm
            title="Добро пожаловать"
            subtitle="Введите данные для входа"
            error={error}
            loading={loading}
            submitLabel="Войти"
            loadingLabel="Вход..."
            onSubmit={handleSubmit}
            footer={<p>Нет аккаунта? <Link to="/register">Создать сейчас</Link></p>}
        >
            <AuthField label="Email" type="email" placeholder="example@mail.com" value={email} onChange={setEmail} />
            <AuthField label="Пароль" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
        </AuthForm>
    )
}
