import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Building2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Spinner } from '../../components/common/UI'

const DEMO_CREDS = [
  { label: 'Patient',      email: 'patient@demo.com',                password: 'Patient@123',  role: 'patient' },
  { label: 'Receptionist', email: 'receptionist@citygeneral.com',    password: 'Recept@123',   role: 'receptionist' },
  { label: 'Doctor',       email: 'dr.priya@citygeneral.com',        password: 'Doctor@123',   role: 'doctor' },
]

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const res = await login(form)
    if (res.success) {
      const map = { patient: '/patient', receptionist: '/receptionist', doctor: '/doctor' }
      navigate(map[res.role])
    } else {
      setError(res.error)
    }
  }

  const fillDemo = (cred) => setForm({ email: cred.email, password: cred.password })

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center mb-4 shadow-xl shadow-teal-500/30">
            <Building2 className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">MediQueue</h1>
          <p className="text-slate-500 text-sm mt-1">Real-Time Hospital Queue Management</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <input
                type="email" name="email" className="field-input"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} name="password"
                  className="field-input pr-10"
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange} required
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <Spinner /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            No account?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium">Create one</Link>
          </p>
        </div>

        {/* Demo quick-fill */}
        <div className="mt-4 card p-4">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Demo Credentials</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_CREDS.map(c => (
              <button key={c.role} onClick={() => fillDemo(c)}
                className="text-xs py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors">
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">Click to auto-fill, then Sign In</p>
        </div>
      </div>
    </div>
  )
}
