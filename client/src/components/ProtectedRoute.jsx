import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
    const { user } = useAuth()
    const location = useLocation()

    if (!user) return <Navigate to="/login" replace />

    if (role && user.role !== role) return <Navigate to="/" replace />

    if (user.role === 'doctor') {
        const path = location.pathname
        if (user.last_view === 'patient' && path.startsWith('/doctor')) {
            return <Navigate to="/doctors" replace />
        }
        if (user.last_view === 'doctor' && (
            path.startsWith('/appointments') || path.startsWith('/booking')
        )) {
            return <Navigate to="/doctor/schedule" replace />
        }
    }

    return children
}