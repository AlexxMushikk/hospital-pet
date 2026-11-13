import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './context/AuthContext'

import Navbar from './components/navbar/Navbar'
import Footer from './components/footer/Footer'
import ProtectedRoute from './components/protected-route/ProtectedRoute'
import ErrorBoundary from './components/error-boundary/ErrorBoundary'

// pages
import Home             from './pages/home/Home'
import Login            from './pages/login/Login'
import Register         from './pages/register/Register'
import Doctors          from './pages/doctors/Doctors'
import Booking          from './pages/booking/Booking'
import Appointments     from './pages/appointments/Appointments'
import DoctorProfile    from './pages/doctor-profile/DoctorProfile'
import DoctorSchedule   from './pages/doctor-schedule/DoctorSchedule'
import DoctorEditProfile from './pages/doctor-edit-profile/DoctorEditProfile'
import AppointmentDetails from './pages/appointment-details/AppointmentDetails'
import NotFound from './pages/not-found/NotFound'

// Admin pages
import AdminStats       from './pages/admin/stats/Stats'
import AdminDatabase    from './pages/admin/database/Database'
import AdminEditRecord  from './pages/admin/edit-record/EditRecord'
import CreateDoctor from './pages/admin/create-doctor/CreateDoctor'

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
                <Route path="/"          element={<Home />} />
                <Route path="/doctors"   element={<Doctors />} />
                <Route path="/doctors/:id" element={<DoctorProfile />} />

                <Route path="/login"    element={user ? <Navigate to={landingFor(user)} replace /> : <Login />} />
                <Route path="/register" element={user ? <Navigate to={landingFor(user)} replace /> : <Register />} />

                <Route path="/booking"      element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/appointments/:id" element={<ProtectedRoute><AppointmentDetails /></ProtectedRoute>}/>

                <Route path="/doctor/schedule"
                       element={<ProtectedRoute role="doctor"><DoctorSchedule /></ProtectedRoute>} />
                <Route path="/doctor/profile"
                       element={<ProtectedRoute role="doctor"><DoctorEditProfile /></ProtectedRoute>} />

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
    const { authLoading } = useAuth()
    const { t } = useTranslation()

    if (authLoading) {
        return <div className="app-loading">{t('app.loading')}</div>
    }

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <div className="app-shell">
                    <Navbar />
                    <main className="app-main">
                        <AppRoutes />
                    </main>
                    <Footer />
                </div>
            </ErrorBoundary>
        </BrowserRouter>
    )
}
