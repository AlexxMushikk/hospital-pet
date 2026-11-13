import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../../../../styles/buttons.css'
import '../../../../styles/layout.css'
import './RecordFormShell.css'

export default function RecordFormShell({ title, onSubmit, submitting, error, children }) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    return (
        <main className="container">
            <section className="page-title">
                <h2>{title}</h2>
            </section>

            <div className="auth-card record-card">
                <form className="record-form" onSubmit={onSubmit}>
                    {children}

                    {error && (
                        <div className="record-error">
                            {error}
                        </div>
                    )}

                    <div className="record-actions">
                        <button
                            type="button"
                            className="btn btn-outline w-full"
                            onClick={() => navigate('/admin/database')}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-solid w-full"
                            disabled={submitting}
                        >
                            {submitting ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
