import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getPublicStats } from '../../api/index'
import { logger } from '../../utils/logger'
import { SPECIALIZATIONS } from '../../constants'
import '../../styles/buttons.css'
import '../../styles/layout.css'
import './Home.css'

export default function Home() {
    const { user } = useAuth()
    const { t, i18n } = useTranslation()
    const [stats, setStats] = useState(null)

    useEffect(() => {
        getPublicStats()
            .then(res => setStats(res.data))
            .catch(err => logger.error('Home.publicStats', err))
    }, [])

    return (
        <div>
            {/* ── HERO ── */}
            <section className="hero">
                <div className="container hero-grid">
                    <div className="hero-text">
                        <h2>
                            {t('home.heroTitleLine1')}<br />
                            <span className="hero-accent">{t('home.heroTitleLine2')}</span>
                        </h2>
                        <p>
                            {t('home.heroText')}
                        </p>
                        <div className="hero-actions">
                            <Link to="/doctors" className="btn btn-solid btn-lg">
                                {t('home.findDoctor')}
                            </Link>
                            {!user && (
                                <Link to="/register" className="btn btn-outline btn-lg">
                                    {t('home.createAccount')}
                                </Link>
                            )}
                            {user && (
                                <Link to="/appointments" className="btn btn-outline btn-lg">
                                    {t('nav.myAppointments')}
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hero-image">
                        <div className="hospital-logo-placeholder">+</div>
                    </div>
                </div>
            </section>

            {stats && (
                <div className="stats-band">
                    <div className="container">
                        <div className="stats-band-grid">
                            <div>
                                <div className="stats-band-num">
                                    {stats.doctorsCount}
                                </div>
                                <div className="stats-band-label">
                                    {t('home.statDoctors')}
                                </div>
                            </div>
                            <div>
                                <div className="stats-band-num">
                                    {stats.specializationsCount}
                                </div>
                                <div className="stats-band-label">
                                    {t('home.statSpecializations')}
                                </div>
                            </div>
                            <div>
                                <div className="stats-band-num">
                                    {new Intl.NumberFormat(i18n.resolvedLanguage).format(stats.completedAppointments)}
                                </div>
                                <div className="stats-band-label">
                                    {t('home.statCompleted')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <section className="features section-pad-top">
                <div className="container">
                    <div className="page-title page-title--mb">
                        <h2>{t('home.specializationsTitle')}</h2>
                        <p className="section-subtitle">
                            {t('home.specializationsSubtitle')}
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
                                    <h3>{t(`spec.${spec.value}.label`)}</h3>
                                    <p className="feature-desc">
                                        {t(`spec.${spec.value}.desc`)}
                                    </p>
                                    <div className="feature-cta">
                                        {t('home.findSpecialist')}
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
                            {t('home.ctaTitle')}
                        </h2>
                        <p className="cta-text">
                            {t('home.ctaText')}
                        </p>
                        <div className="cta-actions">
                            <Link to="/register" className="btn btn-solid btn-lg">
                                {t('auth.registerSubmit')}
                            </Link>
                            <Link to="/login" className="btn btn-outline btn-lg">
                                {t('nav.login')}
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
