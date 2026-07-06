import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
    const { user, view } = useAuth()
    const location = useLocation()

    if (!user) return <Navigate to="/login" replace />

    if (role && user.role !== role) return <Navigate to="/" replace />

    if (user.role === 'doctor' && view === 'patient' && location.pathname.startsWith('/doctor')) {
        return <Navigate to="/doctors" replace />
    }

    return children
}
