import { useNavigate } from 'react-router-dom'

export default function RecordFormShell({ title, onSubmit, submitting, error, children }) {
    const navigate = useNavigate()

    return (
        <main className="container">
            <section className="page-title">
                <h2>{title}</h2>
            </section>

            <div className="auth-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <form className="record-form" onSubmit={onSubmit}>
                    {children}

                    {error && (
                        <div style={{ color: '#dc2626', marginTop: '15px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="button"
                            className="btn btn-outline w-full"
                            onClick={() => navigate('/admin/database')}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="btn btn-solid w-full"
                            disabled={submitting}
                        >
                            {submitting ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
