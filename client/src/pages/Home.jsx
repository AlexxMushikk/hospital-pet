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
                            <span className="hero-accent">Наш приоритет</span>
                        </h2>
                        <p>
                            Добро пожаловать в City Care Hospital. Мы предоставляем
                            медицинские услуги высшего уровня с лучшими специалистами.
                        </p>
                        <div className="hero-actions">
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
                <div className="stats-band">
                    <div className="container">
                        <div className="stats-band-grid">
                            <div>
                                <div className="stats-band-num">
                                    {stats.doctorsCount}
                                </div>
                                <div className="stats-band-label">
                                    Врачей-специалистов
                                </div>
                            </div>
                            <div>
                                <div className="stats-band-num">
                                    {stats.specializationsCount}
                                </div>
                                <div className="stats-band-label">
                                    Специализаций
                                </div>
                            </div>
                            <div>
                                <div className="stats-band-num">
                                    {new Intl.NumberFormat('pl-PL').format(stats.completedAppointments)}
                                </div>
                                <div className="stats-band-label">
                                    Завершённых визитов
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── СПЕЦИАЛИЗАЦИИ ── */}
            <section className="features section-pad-top">
                <div className="container">
                    <div className="page-title page-title--mb">
                        <h2>Наши специализации</h2>
                        <p className="section-subtitle">
                            Квалифицированная помощь по всем направлениям медицины
                        </p>
                    </div>

                    <div className="services-grid">
                        {SPECIALIZATIONS.map((spec) => (
                            <Link
                                key={spec.value}
                                to={`/doctors?specialization=${encodeURIComponent(spec.value)}`}
                                className="spec-link"
                            >
                                <div className="feature-card feature-card--link">
                                    <div className="feature-icon">{spec.icon}</div>
                                    <h3>{spec.label}</h3>
                                    <p className="feature-desc">
                                        {spec.desc}
                                    </p>
                                    <div className="feature-cta">
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
                <section className="cta-section">
                    <div className="container text-center">
                        <h2 className="cta-title">
                            Готовы записаться?
                        </h2>
                        <p className="cta-text">
                            Создайте аккаунт и запишитесь к врачу за несколько минут
                        </p>
                        <div className="cta-actions">
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
