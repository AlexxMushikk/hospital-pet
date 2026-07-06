import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout, switchView, view } = useAuth()
    const navigate = useNavigate()
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
                                <li><NavLink to="/" end className={navClass}>Главная</NavLink></li>
                                <li><NavLink to="/doctors" className={navClass}>Врачи</NavLink></li>
                                {user && <li><NavLink to="/appointments" className={navClass}>Мои визиты</NavLink></li>}
                            </>
                        )}
                        {effectiveRole === 'doctor' && (
                            <>
                                <li><NavLink to="/doctor/schedule" className={navClass}>Расписание</NavLink></li>
                                <li><NavLink to="/doctor/profile" className={navClass}>Настройки</NavLink></li>
                            </>
                        )}
                        {effectiveRole === 'admin' && (
                            <>
                                <li><NavLink to="/admin/stats" className={navClass}>Статистика</NavLink></li>
                                <li><NavLink to="/admin/database" className={navClass}>База данных</NavLink></li>
                            </>
                        )}
                    </ul>

                    <div className="nav-actions">
                        {user ? (
                            <>
                                {user.role === 'doctor' && (
                                    <div className="view-switcher">
                                        <button
                                            className={`view-btn ${view === 'patient' ? 'active' : ''}`}
                                            onClick={() => switchView('patient', navigate)}
                                        >
                                            Пациент
                                        </button>
                                        <button
                                            className={`view-btn ${view === 'doctor' ? 'active' : ''}`}
                                            onClick={() => switchView('doctor', navigate)}
                                        >
                                            Врач
                                        </button>
                                    </div>
                                )}
                                <span><strong>{user.full_name}</strong></span>
                                <button className="btn btn-outline btn-sm" onClick={logout}>
                                    Выйти
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className="btn btn-outline btn-sm">Войти</NavLink>
                                <NavLink to="/register" className="btn btn-solid btn-sm">Регистрация</NavLink>
                            </>
                        )}
                    </div>

                </div>
            </nav>
        </header>
    )
}
