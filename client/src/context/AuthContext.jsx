/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import axios from 'axios'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('hospital_user')
        return stored ? JSON.parse(stored) : null
    })
    const [token, setToken] = useState(null)

    // Вид врача (doctor / patient) — состояние конкретного устройства, живёт в localStorage.
    const [view, setView] = useState(() => localStorage.getItem('hospital_view') || 'doctor')

    const login = (userData, accessToken) => {
        localStorage.setItem('hospital_user', JSON.stringify(userData))
        setUser(userData)
        setToken(accessToken)
    }

    const logout = async () => {
        try {
            await axios.post('/api/logout', {}, { withCredentials: true })
        } catch {
            // Ошибка при логауте не критична — токен и так протухнет.
        }
        localStorage.removeItem('hospital_user')
        setUser(null)
        setToken(null)
    }

    const switchView = (next, navigate) => {
        if (next !== 'patient' && next !== 'doctor') return
        localStorage.setItem('hospital_view', next)
        setView(next)
        // Переадресация на стартовую страницу выбранного вида.
        if (navigate) navigate(next === 'doctor' ? '/doctor/schedule' : '/')
    }

    const updateToken = (newToken) => {
        setToken(newToken)
    }

    return (
        <AuthContext.Provider value={{ user, token, view, login, logout, switchView, updateToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
