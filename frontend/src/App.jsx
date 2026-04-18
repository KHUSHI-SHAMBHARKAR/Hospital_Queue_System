import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

import LandingPage   from './pages/LandingPage'
import LoginPage     from './pages/auth/LoginPage'
import RegisterPage  from './pages/auth/RegisterPage'

import PatientDashboard  from './pages/patient/PatientDashboard'
import HospitalsPage     from './pages/patient/HospitalsPage'
import BookAppointment   from './pages/patient/BookAppointment'
import MyAppointments    from './pages/patient/MyAppointments'
import QueueTracker      from './pages/patient/QueueTracker'

import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard'
import WalkInForm            from './pages/receptionist/WalkInForm'
import HospitalQueue         from './pages/receptionist/HospitalQueue'
import AnalyticsDashboard    from './pages/receptionist/AnalyticsDashboard'

import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorQueue     from './pages/doctor/DoctorQueue'

import Layout from './components/common/Layout'

// ── Guards ────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) {
    const map = { patient: '/patient', receptionist: '/receptionist', doctor: '/doctor' }
    return <Navigate to={map[user?.role] || '/login'} replace />
  }
  return children
}

// If logged-in user hits /login or /register, send to their dashboard
const PublicRoute = ({ children }) => {
  const { user, token } = useAuth()
  if (token) {
    const map = { patient: '/patient', receptionist: '/receptionist', doctor: '/doctor' }
    return <Navigate to={map[user?.role] || '/patient'} replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* ── Public ──────────────────────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* ── Patient ─────────────────────────────────────────────────── */}
          <Route path="/patient"
            element={<ProtectedRoute roles={['patient']}><Layout /></ProtectedRoute>}>
            <Route index                               element={<PatientDashboard />} />
            <Route path="hospitals"                    element={<HospitalsPage />} />
            <Route path="book/:hospitalId"             element={<BookAppointment />} />
            <Route path="appointments"                 element={<MyAppointments />} />
            <Route path="queue/:hospitalId/:department" element={<QueueTracker />} />
          </Route>

          {/* ── Receptionist ────────────────────────────────────────────── */}
          <Route path="/receptionist"
            element={<ProtectedRoute roles={['receptionist']}><Layout /></ProtectedRoute>}>
            <Route index            element={<ReceptionistDashboard />} />
            <Route path="walkin"    element={<WalkInForm />} />
            <Route path="queue"     element={<HospitalQueue />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
          </Route>

          {/* ── Doctor ──────────────────────────────────────────────────── */}
          <Route path="/doctor"
            element={<ProtectedRoute roles={['doctor']}><Layout /></ProtectedRoute>}>
            <Route index        element={<DoctorDashboard />} />
            <Route path="queue" element={<DoctorQueue />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  )
}