import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPublicStats } from '../api/index'
import { SPECIALIZATIONS } from '../constants'

export default function Home() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)

    useEffect(() => {
        getPublicStats()
            .then(res => setStats(res.data))
            .catch(err => console.error('public stats failed:', err))
    }, [])

    return (
        <div>
            {/* ── HERO ── */}
            <section className="hero">
                <div className="container hero-grid">
                    <div className="hero-text">
                        <h2>
                            Ваше здоровье —<br />
                            <span style={{ color: '#333' }}>Наш приоритет</span>
                        </h2>
                        <p>
                            Добро пожаловать в City Care Hospital. Мы предоставляем
                            медицинские услуги высшего уровня с лучшими специалистами.
                        </p>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <Link to="/doctors" className="btn btn-solid btn-lg">
                                Найти врача
                            </Link>
                            {!user && (
                                <Link to="/register" className="btn btn-outline btn-lg">
                                    Создать аккаунт
                                </Link>
                            )}
                            {user && (
                                <Link to="/appointments" className="btn btn-outline btn-lg">
                                    Мои визиты
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hero-image">
                        <div className="hospital-logo-placeholder">+</div>
                    </div>
                </div>
            </section>

            {/* ── СТАТИСТИКА ── */}
            {stats && (
                <div style={{ background: '#dc2626', padding: '40px 0' }}>
                    <div className="container">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
                            <div>
                                <div style={{ fontSize: '36px', fontWeight: 800, color: 'white' }}>
                                    {stats.doctorsCount}
                                </div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '5px' }}>
                                    Врачей-специалистов
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '36px', fontWeight: 800, color: 'white' }}>
                                    {stats.specializationsCount}
                                </div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '5px' }}>
                                    Специализаций
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '36px', fontWeight: 800, color: 'white' }}>
                                    {new Intl.NumberFormat('pl-PL').format(stats.completedAppointments)}
                                </div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '5px' }}>
                                    Завершённых визитов
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── СПЕЦИАЛИЗАЦИИ ── */}
            <section className="features" style={{ paddingTop: '60px' }}>
                <div className="container">
                    <div className="page-title" style={{ marginBottom: '40px' }}>
                        <h2>Наши специализации</h2>
                        <p style={{ color: '#6b7280', marginTop: '10px' }}>
                            Квалифицированная помощь по всем направлениям медицины
                        </p>
                    </div>

                    <div className="services-grid">
                        {SPECIALIZATIONS.map((spec) => (
                            <Link
                                key={spec.value}
                                to={`/doctors?specialization=${encodeURIComponent(spec.value)}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="feature-card" style={{ cursor: 'pointer', height: '100%' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>{spec.icon}</div>
                                    <h3>{spec.label}</h3>
                                    <p style={{ color: '#6b7280', marginTop: '10px', fontSize: '14px', lineHeight: '1.6' }}>
                                        {spec.desc}
                                    </p>
                                    <div style={{ marginTop: '15px', color: '#dc2626', fontWeight: 600, fontSize: '14px' }}>
                                        Найти специалиста →
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            {!user && (
                <section style={{ padding: '60px 0', background: '#f9fafb' }}>
                    <div className="container" style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '32px', marginBottom: '15px' }}>
                            Готовы записаться?
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '18px' }}>
                            Создайте аккаунт и запишитесь к врачу за несколько минут
                        </p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <Link to="/register" className="btn btn-solid btn-lg">
                                Зарегистрироваться
                            </Link>
                            <Link to="/login" className="btn btn-outline btn-lg">
                                Войти
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
