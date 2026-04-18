import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Building2, Eye, EyeOff, ArrowRight, Sun, Moon, ArrowLeft } from 'lucide-react'
import { Spinner } from '../../components/common/UI'

const DEMO = [
  { label: 'Patient',      email: 'patient@demo.com',                password: 'Patient@123' },
  { label: 'Receptionist', email: 'receptionist1@mediqueue.com',     password: 'Recept@123'  },
  { label: 'Doctor',       email: 'doctor1@sevenstar.com',           password: 'Doctor@123'  },
]

export default function LoginPage() {
  const { login, loading }       = useAuth()
  const { isDark, toggleTheme }  = useTheme()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const res = await login(form)
    if (res.success) {
      navigate({ patient: '/patient', receptionist: '/receptionist', doctor: '/doctor' }[res.role])
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-500/25">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">MediQueue</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
          </div>

          {/* Card */}
          <div className="card p-7">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="field-group">
                <label className="field-label">Email address</label>
                <input type="email" name="email" className="field-input"
                  placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} name="password"
                    className="field-input pr-10"
                    placeholder="••••••••"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
              No account?{' '}
              <Link to="/register" className="text-teal-500 hover:text-teal-400 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo quick-fill */}
          <div className="card p-4 mt-4">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Demo credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map(c => (
                <button key={c.label}
                  onClick={() => setForm({ email: c.email, password: c.password })}
                  className="text-xs py-2 px-2 rounded-xl transition-all text-center font-medium"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.color = '#14b8a6' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              Click to auto-fill, then Sign In
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}