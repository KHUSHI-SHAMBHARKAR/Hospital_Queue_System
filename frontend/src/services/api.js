import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
  update:   (data) => api.put('/auth/me', data),
}

// ── Hospitals ─────────────────────────────────────────────────────────────────
export const hospitalApi = {
  getAll:  (params) => api.get('/hospitals', { params }),
  getById: (id)     => api.get(`/hospitals/${id}`),
}

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentApi = {
  // Patient: book without doctor
  book:           (data)            => api.post('/appointments', data),
  // Receptionist: walk-in
  addWalkIn:      (data)            => api.post('/appointments/walkin', data),
  // Receptionist: assign doctor
  assignDoctor:   (id, doctorId)    => api.patch(`/appointments/${id}/assign-doctor`, { doctorId }),
  // Cancel
  cancel:         (id)              => api.delete(`/appointments/${id}`),
  // Patient history
  getMy:          (params)          => api.get('/appointments/my', { params }),
  // Receptionist: hospital view
  getHospital:    (hid, params)     => api.get(`/appointments/hospital/${hid}`, { params }),
}

// ── Queue ─────────────────────────────────────────────────────────────────────
export const queueApi = {
  // Get department queue (anyone)
  getDeptQueue:      (hospitalId, dept)  => api.get(`/queue/department/${hospitalId}/${encodeURIComponent(dept)}`),
  // Receptionist: call next in dept
  callNextInDept:    (hospitalId, dept)  => api.patch(`/queue/next/${hospitalId}/${encodeURIComponent(dept)}`),
  // Doctor: own queue
  getMyDoctorQueue:  ()                  => api.get('/queue/doctor/me'),
  // Doctor: call next in their list
  callNextForDoctor: ()                  => api.patch('/queue/doctor/next'),
  // Update status
  updateStatus:      (id, status)        => api.patch(`/queue/appointment/${id}/status`, { status }),
  // Emergency
  markEmergency:     (id)                => api.patch(`/queue/appointment/${id}/emergency`),
  // Toggle availability
  toggleAvailability: ()                 => api.patch('/queue/availability'),
}

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctorApi = {
  getAll:  (params) => api.get('/doctors', { params }),
  getById: (id)     => api.get(`/doctors/${id}`),
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export const feedbackApi = {
  submit:       (data)     => api.post('/feedback', data),
  getForDoctor: (doctorId) => api.get(`/feedback/doctor/${doctorId}`),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getHospital: (hospitalId) => api.get(`/analytics/hospital/${hospitalId}`),
}

export default api
