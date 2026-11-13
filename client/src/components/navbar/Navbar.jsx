import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../language-switcher/LanguageSwitcher'
import ThemeSwitcher from '../theme-switcher/ThemeSwitcher'
import '../../styles/buttons.css'
import './Navbar.css'

export default function Navbar() {
    const { user, logout, switchView, view } = useAuth()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const effectiveRole = user?.role === 'doctor' && view === 'patient' ? 'patient' : user?.role

    const navClass = ({ isActive }) => isActive ? 'active' : undefined

    return (
        <header>
            <div className="main-header">
                <div className="container">
                    <h1>🏥 City Care Hospital</h1>
                </div>
            </div>

            <nav className="navbar">
                <div className="container flex-nav">

                    <ul className="nav-links">
                        {(!user || effectiveRole === 'patient') && (
                            <>
                                <li><NavLink to="/" end className={navClass}>{t('nav.home')}</NavLink></li>
                                <li><NavLink to="/doctors" className={navClass}>{t('nav.doctors')}</NavLink></li>
                                {user && <li><NavLink to="/appointments" className={navClass}>{t('nav.myAppointments')}</NavLink></li>}
                            </>
                        )}
                        {effectiveRole === 'doctor' && (
                            <>
                                <li><NavLink to="/doctor/schedule" className={navClass}>{t('nav.schedule')}</NavLink></li>
                                <li><NavLink to="/doctor/profile" className={navClass}>{t('nav.settings')}</NavLink></li>
                            </>
                        )}
                        {effectiveRole === 'admin' && (
                            <>
                                <li><NavLink to="/admin/stats" className={navClass}>{t('nav.stats')}</NavLink></li>
                                <li><NavLink to="/admin/database" className={navClass}>{t('nav.database')}</NavLink></li>
                            </>
                        )}
                    </ul>

                    <div className="nav-actions">
                        <ThemeSwitcher />
                        <LanguageSwitcher />
                        {user ? (
                            <>
                                {user.role === 'doctor' && (
                                    <div className="view-switcher">
                                        <button
                                            className={`view-btn ${view === 'patient' ? 'active' : ''}`}
                                            onClick={() => switchView('patient', navigate)}
                                        >
                                            {t('nav.viewPatient')}
                                        </button>
                                        <button
                                            className={`view-btn ${view === 'doctor' ? 'active' : ''}`}
                                            onClick={() => switchView('doctor', navigate)}
                                        >
                                            {t('nav.viewDoctor')}
                                        </button>
                                    </div>
                                )}
                                <span><strong>{user.full_name}</strong></span>
                                <button className="btn btn-outline btn-sm" onClick={logout}>
                                    {t('nav.logout')}
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className="btn btn-outline btn-sm">{t('nav.login')}</NavLink>
                                <NavLink to="/register" className="btn btn-solid btn-sm">{t('nav.register')}</NavLink>
                            </>
                        )}
                    </div>

                </div>
            </nav>
        </header>
    )
}
