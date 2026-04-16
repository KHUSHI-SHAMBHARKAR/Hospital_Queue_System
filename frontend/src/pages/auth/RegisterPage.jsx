import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Building2, ArrowRight, ChevronDown } from 'lucide-react'
import { Spinner } from '../../components/common/UI'
import { hospitalApi } from '../../services/api'

const DEPARTMENTS = ['Cardiology','Orthopedics','Neurology','General Medicine','Pediatrics','Dermatology','ENT','Gynecology','Ophthalmology','Psychiatry']

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
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

  // When department changes for doctor, auto-fill specialization
  const handleDeptChange = e => {
    setForm(p => ({ ...p, department: e.target.value, specialization: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const res = await register(form)
    if (res.success) {
      navigate({ patient: '/patient', receptionist: '/receptionist', doctor: '/doctor' }[res.role])
    } else { setError(res.error) }
  }

  const roles = [
    { value: 'patient',      label: 'Patient',      desc: 'Book & track appointments' },
    { value: 'receptionist', label: 'Receptionist', desc: 'Manage hospital queue' },
    { value: 'doctor',       label: 'Doctor',       desc: 'View your assigned patients' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center mb-4 shadow-xl shadow-teal-500/30">
            <Building2 className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">MediQueue</h1>
          <p className="text-slate-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="mb-6">
            <label className="field-label mb-2">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => (
                <button key={r.value} type="button"
                  onClick={() => setForm(p => ({ ...p, role: r.value }))}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    form.role === r.value
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}>
                  <p className="font-semibold">{r.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="field-group">
              <label className="field-label">Full Name</label>
              <input type="text" name="name" className="field-input" placeholder="Your full name"
                value={form.name} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <input type="email" name="email" className="field-input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label className="field-label">Phone Number</label>
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
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Specialization</label>
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
                    <option value="">Select hospital...</option>
                    {hospitals.map(h => (
                      <option key={h._id} value={h._id}>{h.name} — {h.address?.city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <Spinner /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
