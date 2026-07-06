import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerRequest } from '../api/index'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { VALIDATION } from '../constants'
import AuthForm, { AuthField } from '../components/AuthForm'

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

        if (fullName.length < VALIDATION.NAME_MIN) {
            setError('Имя должно содержать минимум 2 символа')
            return
        }
        if (password.length < VALIDATION.PASSWORD_MIN) {
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
        <>
            <AuthForm
                title="Создать аккаунт"
                subtitle="Присоединяйтесь к City Care Hospital"
                error={error}
                loading={loading}
                submitLabel="Зарегистрироваться"
                loadingLabel="Регистрация..."
                onSubmit={handleSubmit}
                footer={<p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>}
            >
                <AuthField
                    label="Полное имя"
                    type="text"
                    placeholder="Иван Иванов"
                    value={fullName}
                    onChange={setFullName}
                    minLength={VALIDATION.NAME_MIN}
                />
                <AuthField
                    label="Email"
                    type="email"
                    placeholder="example@mail.com"
                    value={email}
                    onChange={setEmail}
                />
                <AuthField
                    label="Пароль"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    minLength={VALIDATION.PASSWORD_MIN}
                />
            </AuthForm>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
            />
        </>
    )
}
