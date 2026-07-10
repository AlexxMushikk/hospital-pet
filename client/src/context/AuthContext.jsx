/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { refreshSession } from '../api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser]   = useState(null)
    const [token, setToken] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    const [view, setView] = useState(() => localStorage.getItem('hospital_view') || 'doctor')

    useEffect(() => {
        let cancelled = false
        refreshSession()
            .then((data) => {
                if (cancelled) return
                setUser(data.user)
                setToken(data.accessToken)
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setAuthLoading(false) })
        return () => { cancelled = true }
    }, [])

    const login = (userData, accessToken) => {
        setUser(userData)
        setToken(accessToken)
    }

    const logout = async () => {
        try {
            await axios.post('/api/logout', {}, { withCredentials: true })
        } catch {
            // Ошибка при логауте не критична — токен и так протухнет.
        }
        setUser(null)
        setToken(null)
    }

    const switchView = (next, navigate) => {
        if (next !== 'patient' && next !== 'doctor') return
        localStorage.setItem('hospital_view', next)
        setView(next)
        if (navigate) navigate(next === 'doctor' ? '/doctor/schedule' : '/')
    }

    const updateToken = (newToken) => {
        setToken(newToken)
    }

    return (
        <AuthContext.Provider value={{ user, token, view, authLoading, login, logout, switchView, updateToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
