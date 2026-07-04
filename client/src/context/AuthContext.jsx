/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import axios from 'axios'
import { updateView as updateViewRequest } from '../api/index'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('hospital_user')
        return stored ? JSON.parse(stored) : null
    })
    const [token, setToken] = useState(null)

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

    const switchView = async (view) => {
        if (!user) return
        if (user.last_view === view) return   // уже в этом режиме — ничего не делаем

        const previous = user.last_view
        const optimistic = { ...user, last_view: view }

        // Optimistic: обновляем UI сразу
        localStorage.setItem('hospital_user', JSON.stringify(optimistic))
        setUser(optimistic)

        try {
            await updateViewRequest({ last_view: view })
        } catch {
            // Откатываемся при ошибке
            const reverted = { ...user, last_view: previous }
            localStorage.setItem('hospital_user', JSON.stringify(reverted))
            setUser(reverted)
            throw new Error('Не удалось переключить режим')
        }
    }

    const updateToken = (newToken) => {
        setToken(newToken)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, switchView, updateToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
