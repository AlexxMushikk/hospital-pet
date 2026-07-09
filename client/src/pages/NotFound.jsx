import { useNavigate } from 'react-router-dom'

export default function NotFound() {
    const navigate = useNavigate()
    return (
        <div className="auth-container">
            <div className="auth-card text-center">
                <h2 className="notfound-code">404</h2>
                <p className="notfound-text">
                    Страница не найдена
                </p>
                <button className="btn btn-solid" onClick={() => navigate('/')}>
                    На главную
                </button>
            </div>
        </div>
    )
}
