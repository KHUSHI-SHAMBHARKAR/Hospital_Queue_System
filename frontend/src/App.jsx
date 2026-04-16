import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

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

import Layout        from './components/common/Layout'
import LoadingScreen from './components/common/LoadingScreen'

const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) {
    const map = { patient: '/patient', receptionist: '/receptionist', doctor: '/doctor' }
    return <Navigate to={map[user?.role] || '/login'} replace />
  }
  return children
}

const RoleRedirect = () => {
  const { user, token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  const map = { patient: '/patient', receptionist: '/receptionist', doctor: '/doctor' }
  return <Navigate to={map[user?.role] || '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/"         element={<RoleRedirect />} />

          {/* Patient */}
          <Route path="/patient" element={<ProtectedRoute roles={['patient']}><Layout /></ProtectedRoute>}>
            <Route index                                     element={<PatientDashboard />} />
            <Route path="hospitals"                          element={<HospitalsPage />} />
            {/* book/:hospitalId — department chosen inside page */}
            <Route path="book/:hospitalId"                   element={<BookAppointment />} />
            <Route path="appointments"                       element={<MyAppointments />} />
            {/* queue tracker: by hospital + department */}
            <Route path="queue/:hospitalId/:department"      element={<QueueTracker />} />
          </Route>

          {/* Receptionist */}
          <Route path="/receptionist" element={<ProtectedRoute roles={['receptionist']}><Layout /></ProtectedRoute>}>
            <Route index         element={<ReceptionistDashboard />} />
            <Route path="walkin"    element={<WalkInForm />} />
            <Route path="queue"     element={<HospitalQueue />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
          </Route>

          {/* Doctor */}
          <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><Layout /></ProtectedRoute>}>
            <Route index     element={<DoctorDashboard />} />
            <Route path="queue" element={<DoctorQueue />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  )
}
