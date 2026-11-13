import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    return (
        <div className="auth-container">
            <div className="auth-card text-center">
                <h2 className="notfound-code">404</h2>
                <p className="notfound-text">
                    {t('notFound.text')}
                </p>
                <button className="btn btn-solid" onClick={() => navigate('/')}>
                    {t('common.goHome')}
                </button>
            </div>
        </div>
    )
}
