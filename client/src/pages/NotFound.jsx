import { useNavigate } from 'react-router-dom'

export default function NotFound() {
    const navigate = useNavigate()
    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '4rem', margin: 0 }}>404</h2>
                <p style={{ color: '#6b7280', margin: '10px 0 25px' }}>
                    Страница не найдена
                </p>
                <button className="btn btn-solid" onClick={() => navigate('/')}>
                    На главную
                </button>
            </div>
        </div>
    )
}