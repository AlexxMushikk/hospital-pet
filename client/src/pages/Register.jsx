import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerRequest } from '../api/index'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { VALIDATION } from '../constants'
import { apiErrorMessage } from '../utils/apiError'
import AuthForm, { AuthField } from '../components/AuthForm'

export default function Register() {
    const navigate = useNavigate()
    const { modal, showModal, closeModal } = useModal()
    const { t } = useTranslation()

    const [fullName, setFullName] = useState('')
    const [email,    setEmail]    = useState('')
    const [password, setPassword] = useState('')
    const [error,    setError]    = useState('')
    const [loading,  setLoading]  = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (fullName.length < VALIDATION.NAME_MIN) {
            setError(t('validation.nameMin', { count: VALIDATION.NAME_MIN }))
            return
        }
        if (password.length < VALIDATION.PASSWORD_MIN) {
            setError(t('validation.passwordMin', { count: VALIDATION.PASSWORD_MIN }))
            return
        }

        setLoading(true)
        try {
            await registerRequest({ full_name: fullName, email, password })
            showModal(
                t('auth.accountCreatedTitle'),
                t('auth.accountCreatedText'),
                () => navigate('/login')
            )
        } catch (err) {
            setError(apiErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <AuthForm
                title={t('auth.registerTitle')}
                subtitle={t('auth.registerSubtitle')}
                error={error}
                loading={loading}
                submitLabel={t('auth.registerSubmit')}
                loadingLabel={t('auth.registerLoading')}
                onSubmit={handleSubmit}
                footer={<p>{t('auth.haveAccount')} <Link to="/login">{t('nav.login')}</Link></p>}
            >
                <AuthField
                    label={t('common.fullName')}
                    type="text"
                    placeholder={t('auth.fullNamePlaceholder')}
                    value={fullName}
                    onChange={setFullName}
                    minLength={VALIDATION.NAME_MIN}
                />
                <AuthField
                    label={t('common.email')}
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={setEmail}
                />
                <AuthField
                    label={t('common.password')}
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
