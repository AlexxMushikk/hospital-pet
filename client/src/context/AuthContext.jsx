/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { refreshSession, setTokenGetter } from '../api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser]        = useState(null)
    const [token, setTokenState] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    // The API layer reads the token from this ref, so a request sent right after
    // login or a refresh already carries the new token, before React re-renders.
    const tokenRef = useRef(null)
    const setToken = useCallback((next) => {
        tokenRef.current = next
        setTokenState(next)
    }, [])

    useEffect(() => {
        setTokenGetter(() => tokenRef.current, setToken)
    }, [setToken])

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
    }, [setToken])

    const login = (userData, accessToken) => {
        setUser(userData)
        setToken(accessToken)
    }

    const logout = async () => {
        try {
            await axios.post('/api/logout', {}, { withCredentials: true })
        } catch {
            // Logout errors are non-critical: the token expires anyway.
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

    return (
        <AuthContext.Provider value={{ user, token, view, authLoading, login, logout, switchView }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
