import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Building2, ArrowRight, ChevronDown, Sun, Moon, ArrowLeft } from 'lucide-react'
import { Spinner } from '../../components/common/UI'
import { hospitalApi } from '../../services/api'

const DEPARTMENTS = [
  'Cardiology','Orthopedics','Neurology','General Medicine','Pediatrics',
  'Dermatology','ENT','Gynecology','Ophthalmology','Psychiatry',
]

export default function RegisterPage() {
  const { register, loading }    = useAuth()
  const { isDark, toggleTheme }  = useTheme()
  const navigate  = useNavigate()
  const [hospitals, setHospitals] = useState([])
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'patient',
    phone: '', specialization: '', department: '', hospital: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    hospitalApi.getAll().then(r => setHospitals(r.data.hospitals)).catch(() => {})
  }, [])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const handleDeptChange = e => setForm(p => ({ ...p, department: e.target.value, specialization: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const res = await register(form)
    if (res.success) {
      navigate({ patient: '/patient', receptionist: '/receptionist', doctor: '/doctor' }[res.role])
    } else { setError(res.error) }
  }

  const roles = [
    { value: 'patient',      label: 'Patient',       emoji: '🧑‍⚕️', desc: 'Book & track visits' },
    { value: 'receptionist', label: 'Receptionist',  emoji: '💁',   desc: 'Manage queue & walk-ins' },
    { value: 'doctor',       label: 'Doctor',        emoji: '👨‍⚕️', desc: 'See assigned patients' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-500/25">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">MediQueue</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Create your account</p>
          </div>

          <div className="card p-7">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            {/* Role picker */}
            <div className="mb-5">
              <label className="field-label mb-2 block">I am a…</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(r => (
                  <button key={r.value} type="button"
                    onClick={() => setForm(p => ({ ...p, role: r.value }))}
                    className="p-3 rounded-xl text-left text-xs transition-all"
                    style={{
                      border: `1px solid ${form.role === r.value ? '#14b8a6' : 'var(--border-color)'}`,
                      background: form.role === r.value ? 'rgba(20,184,166,0.08)' : 'var(--bg-elevated)',
                      color: form.role === r.value ? '#14b8a6' : 'var(--text-muted)',
                    }}>
                    <div className="text-lg mb-1">{r.emoji}</div>
                    <p className="font-semibold text-xs">{r.label}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="field-group">
                <label className="field-label">Full name</label>
                <input type="text" name="name" className="field-input" placeholder="Your full name"
                  value={form.name} onChange={handleChange} required />
              </div>
              <div className="field-group">
                <label className="field-label">Email address</label>
                <input type="email" name="email" className="field-input" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div className="field-group">
                <label className="field-label">Phone number</label>
                <input type="tel" name="phone" className="field-input" placeholder="10-digit mobile"
                  value={form.phone} onChange={handleChange} />
              </div>
              <div className="field-group">
                <label className="field-label">Password</label>
                <input type="password" name="password" className="field-input" placeholder="Min. 6 characters"
                  value={form.password} onChange={handleChange} required minLength={6} />
              </div>

              {form.role === 'doctor' && (
                <>
                  <div className="field-group">
                    <label className="field-label">Department</label>
                    <div className="relative">
                      <select name="department" className="field-input appearance-none pr-8"
                        value={form.department} onChange={handleDeptChange} required>
                        <option value="">Select department…</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Specialization title</label>
                    <input type="text" name="specialization" className="field-input"
                      placeholder="e.g. Senior Cardiologist"
                      value={form.specialization} onChange={handleChange} />
                  </div>
                </>
              )}

              {(form.role === 'doctor' || form.role === 'receptionist') && (
                <div className="field-group">
                  <label className="field-label">Hospital</label>
                  <div className="relative">
                    <select name="hospital" className="field-input appearance-none pr-8"
                      value={form.hospital} onChange={handleChange} required>
                      <option value="">Select hospital…</option>
                      {hospitals.map(h => (
                        <option key={h._id} value={h._id}>{h.name} — {h.address?.city}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
                {loading ? <Spinner /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" className="text-teal-500 hover:text-teal-400 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}