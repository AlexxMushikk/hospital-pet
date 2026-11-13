import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login as loginRequest } from '../../api/index'
import AuthForm, { AuthField } from '../../components/auth-form/AuthForm'
import { VALIDATION } from '../../constants'
import { apiErrorMessage } from '../../utils/apiError'

export default function Login() {
    const { login } = useAuth()
    const { t } = useTranslation()

    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState('')
    const [loading, setLoading]   = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!VALIDATION.EMAIL_REGEX.test(email)) {
            setError(t('validation.email'))
            return
        }

        setLoading(true)
        try {
            const response = await loginRequest({ email, password })
            login(response.data.user, response.data.accessToken)
        } catch (err) {
            setError(apiErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthForm
            title={t('auth.loginTitle')}
            subtitle={t('auth.loginSubtitle')}
            error={error}
            loading={loading}
            submitLabel={t('auth.loginSubmit')}
            loadingLabel={t('auth.loginLoading')}
            onSubmit={handleSubmit}
            footer={<p>{t('auth.noAccount')} <Link to="/register">{t('auth.createNow')}</Link></p>}
        >
            <AuthField label={t('common.email')} type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={setEmail} />
            <AuthField label={t('common.password')} type="password" placeholder="••••••••" value={password} onChange={setPassword} />
        </AuthForm>
    )
}
