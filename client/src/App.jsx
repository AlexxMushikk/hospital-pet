import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

// pages
import Home             from './pages/Home'
import Login            from './pages/Login'
import Register         from './pages/Register'
import Doctors          from './pages/Doctors'
import Booking          from './pages/Booking'
import Appointments     from './pages/Appointments'
import DoctorProfile    from './pages/DoctorProfile'
import DoctorSchedule   from './pages/DoctorSchedule'
import DoctorEditProfile from './pages/DoctorEditProfile'
import AppointmentDetails from './pages/AppointmentDetails'
import NotFound from './pages/NotFound'

// Admin pages
import AdminStats       from './pages/admin/Stats'
import AdminDatabase    from './pages/admin/Database'
import AdminEditRecord  from './pages/admin/EditRecord'
import CreateDoctor from './pages/admin/CreateDoctor'

function DoctorViewGuard({ children }) {
    const { user, view } = useAuth()
    const location = useLocation()

    if (user?.role === 'doctor' && view === 'doctor') {
        const path = location.pathname
        const allowed =
            path === '/doctor/schedule' ||
            path === '/doctor/profile' ||
            /^\/appointments\/[^/]+$/.test(path)

        if (!allowed) {
            return <Navigate to="/doctor/schedule" replace />
        }
    }

    return children
}

const LANDING = { doctor: '/doctor/schedule', admin: '/admin/stats' }
const landingFor = (user) => LANDING[user?.role] || '/'

function AppRoutes() {
    const { user } = useAuth()

    return (
        <DoctorViewGuard>
            <Routes>
                {/* Публичные маршруты */}
                <Route path="/"          element={<Home />} />
                <Route path="/doctors"   element={<Doctors />} />
                <Route path="/doctors/:id" element={<DoctorProfile />} />

                {/* Перенаправление залогиненных со страниц auth */}
                <Route path="/login"    element={user ? <Navigate to={landingFor(user)} replace /> : <Login />} />
                <Route path="/register" element={user ? <Navigate to={landingFor(user)} replace /> : <Register />} />

                {/* Защищённые — только для залогиненных (любая роль) */}
                <Route path="/booking"      element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/appointments/:id" element={<ProtectedRoute><AppointmentDetails /></ProtectedRoute>}/>

                {/* Защищённые — только для врачей */}
                <Route path="/doctor/schedule"
                       element={<ProtectedRoute role="doctor"><DoctorSchedule /></ProtectedRoute>} />
                <Route path="/doctor/profile"
                       element={<ProtectedRoute role="doctor"><DoctorEditProfile /></ProtectedRoute>} />

                {/* Защищённые — только для admin */}
                <Route path="/admin"          element={<Navigate to="/admin/stats" replace />} />
                <Route path="/admin/stats"
                       element={<ProtectedRoute role="admin"><AdminStats /></ProtectedRoute>} />
                <Route path="/admin/database"
                       element={<ProtectedRoute role="admin"><AdminDatabase /></ProtectedRoute>} />
                <Route path="/admin/records/:table/:id"
                       element={<ProtectedRoute role="admin"><AdminEditRecord /></ProtectedRoute>} />
                <Route path="/admin/create-doctor"
                       element={<ProtectedRoute role="admin"><CreateDoctor /></ProtectedRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </DoctorViewGuard>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <main style={{ flex: 1 }}>
                        <AppRoutes />
                    </main>
                    <Footer />
                </div>
            </ErrorBoundary>
        </BrowserRouter>
    )
}
